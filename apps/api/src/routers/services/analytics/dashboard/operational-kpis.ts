import { zValidator } from '@hono/zod-validator';
import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';
import { policiesWhere, quotesWhere } from '@/libraries/dashboard/metrics';
import { type DayRange, percentChange } from '@/libraries/dashboard/range';
import { periodRanges, requireBrokerId, SchemaDashboardPeriod } from './query';

const DAY_MS = 86_400_000;

async function kpisOf(database: Database, brokerId: string, range: DayRange) {
	const [quotesTotal, quotesConfirmed, confirmedQuotes, policies, forecast] =
		await Promise.all([
			database.quote.count({ where: quotesWhere(brokerId, range) }),
			database.quote.count({
				where: { ...quotesWhere(brokerId, range), status: 'confirmed' },
			}),
			database.quote.findMany({
				where: { ...quotesWhere(brokerId, range), status: 'confirmed' },
				select: { requestedAt: true, statusAt: true },
			}),
			database.safe.aggregate({
				where: policiesWhere(brokerId, range),
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

	const closingDays = confirmedQuotes.length
		? confirmedQuotes.reduce(
				(total, quote) =>
					total +
					Math.max(0, quote.statusAt.getTime() - quote.requestedAt.getTime()) /
						DAY_MS,
				0,
			) / confirmedQuotes.length
		: 0;

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
