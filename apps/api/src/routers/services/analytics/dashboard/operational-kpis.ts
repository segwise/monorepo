import { zValidator } from '@hono/zod-validator';
import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';
import { Prisma } from '@/generated/prisma/client';
import { productionWhere, quotesWhere } from '@/libraries/dashboard/metrics';
import { type DayRange, percentChange } from '@/libraries/dashboard/range';
import { periodRanges, requireBrokerId, SchemaDashboardPeriod } from './query';

async function kpisOf(database: Database, brokerId: string, range: DayRange) {
	const [quotesByStatus, closing, policies, forecast] = await Promise.all([
		// Total e confirmadas numa consulta só.
		database.quote.groupBy({
			by: ['status'],
			where: quotesWhere(brokerId, range),
			_count: { _all: true },
		}),
		// Média calculada no banco em vez de trazer todas as confirmadas.
		database.$queryRaw<Array<{ days: number | null }>>(Prisma.sql`
			SELECT avg(GREATEST(0, extract(epoch FROM (status_at - requested_at)))) / 86400.0 AS days
			FROM quotes
			WHERE broker_id = ${brokerId}::uuid
				AND requested_at >= ${range.tsFrom}
				AND requested_at <= ${range.tsTo}
				AND status = 'confirmed'
		`),
		database.safe.aggregate({
			where: productionWhere(database, brokerId, range),
			_count: { _all: true },
			_sum: { award: true },
		}),
		// Comissão que as seguradoras devem pagar com vencimento no período.
		database.payment.aggregate({
			where: {
				receiver: { brokerId },
				payer: { insuranceCompanyId: { not: null } },
				status: { not: 'canceled' },
				expiration: { gte: range.tsFrom, lte: range.tsTo },
			},
			_sum: { amount: true },
		}),
	]);

	const quotesTotal = quotesByStatus.reduce(
		(total, item) => total + item._count._all,
		0,
	);
	const quotesConfirmed =
		quotesByStatus.find((item) => item.status === 'confirmed')?._count._all ??
		0;
	const closingDays = Number(closing[0]?.days ?? 0);

	const policiesCount = policies._count._all;
	const netPremium = policies._sum.award?.toNumber() ?? 0;

	return {
		conversionRate: quotesTotal ? quotesConfirmed / quotesTotal : 0,
		averageTicket: policiesCount ? netPremium / policiesCount : 0,
		averageClosingTimeDays: Math.round(closingDays * 10) / 10,
		forecastedCommission: forecast._sum.amount?.toNumber() ?? 0,
	};
}

function registerRoutersServicesAnalyticsDashboardOperationalKpis(
	server: Server,
) {
	server.get(
		'/operational-kpis',
		zValidator('query', SchemaDashboardPeriod),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { current, reference } = periodRanges(
				ctx.req.valid('query'),
				ctx.timezone,
			);

			const [now, before] = await Promise.all([
				kpisOf(ctx.database, brokerId, current),
				kpisOf(ctx.database, brokerId, reference),
			]);

			const pair = (key: keyof typeof now) => ({
				current: now[key],
				before: before[key],
				percent: percentChange(now[key], before[key]),
			});

			return ctx.json(
				{
					conversionRate: pair('conversionRate'),
					averageTicket: pair('averageTicket'),
					averageClosingTimeDays: pair('averageClosingTimeDays'),
					forecastedCommission: pair('forecastedCommission'),
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsDashboardOperationalKpis };
