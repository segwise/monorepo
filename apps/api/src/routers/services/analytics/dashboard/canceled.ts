import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import type { Database } from '@/@types/database';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';
import { EXCLUDED_PRODUCER_ID } from '@/libraries/dashboard/metrics';
import { type DayRange, percentChange } from '@/libraries/dashboard/range';
import { periodRanges, requireBrokerId, SchemaDashboardPeriod } from './query';

const CANCELED_BY_ENDORSEMENT = 'Cancelado por endosso';

// Cancelada = perdeu a vigência por cancelamento (canceledAt preenchido). Quem
// só terminou a vigência também fica "canceled" no banco, mas sem canceledAt,
// e não entra aqui. A data é a do cancelamento, não a do status.
function canceledWhere(
	brokerId: string,
	range: DayRange,
): Prisma.SafeWhereInput {
	return {
		brokerId,
		status: 'canceled',
		canceledAt: { gte: range.dateFrom, lte: range.dateTo },
		AND: [
			{ OR: [{ isExternal: false }, { isExternal: null }] },
			{
				OR: [
					{ producerId: null },
					{ producerId: { not: EXCLUDED_PRODUCER_ID } },
				],
			},
		],
	};
}

const select = {
	id: true,
	award: true,
	canceledAt: true,
	statusMessage: true,
	requestedAt: true,
	insured: { select: { name: true } },
	temporaryInsured: { select: { name: true } },
	safeVehicle: { select: { plate: true } },
	insuranceCompany: { select: { name: true, fantasy: true } },
	endorsements: {
		where: { type: 'cancellation' },
		take: 1,
		select: { id: true },
	},
} satisfies Prisma.SafeSelect;

// Contagem e prêmio vêm de um aggregate no banco; as linhas completas (com
// joins) só são buscadas para os itens exibidos.
async function canceledTotals(
	database: Database,
	brokerId: string,
	range: DayRange,
) {
	const total = await database.safe.aggregate({
		where: canceledWhere(brokerId, range),
		_count: { _all: true },
		_sum: { award: true },
	});

	return {
		count: total._count._all,
		premium: total._sum.award?.toNumber() ?? 0,
	};
}

async function canceledItems(
	database: Database,
	brokerId: string,
	range: DayRange,
	limit: number,
) {
	return await database.safe.findMany({
		where: canceledWhere(brokerId, range),
		orderBy: { canceledAt: 'desc' },
		take: limit,
		select,
	});
}

function registerRoutersServicesAnalyticsDashboardCanceled(server: Server) {
	server.get(
		'/canceled',
		zValidator(
			'query',
			SchemaDashboardPeriod.extend({
				limit: z.coerce.number().min(1).max(20).default(8),
			}),
		),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { limit, ...period } = ctx.req.valid('query');
			const { current, reference } = periodRanges(period, ctx.timezone);

			const [now, before, currentRows] = await Promise.all([
				canceledTotals(ctx.database, brokerId, current),
				canceledTotals(ctx.database, brokerId, reference),
				canceledItems(ctx.database, brokerId, current, limit),
			]);

			return ctx.json(
				{
					count: {
						current: now.count,
						reference: before.count,
						percent: percentChange(now.count, before.count),
					},
					premium: {
						current: now.premium,
						reference: before.premium,
						percent: percentChange(now.premium, before.premium),
					},
					items: currentRows.map((safe) => {
						const byEndorsement = safe.endorsements.length > 0;

						return {
							id: safe.id,
							insured:
								safe.insured?.name ?? safe.temporaryInsured?.name ?? 'Sem nome',
							plate: safe.safeVehicle?.plate ?? null,
							insuranceCompany: safe.insuranceCompany
								? safe.insuranceCompany.fantasy || safe.insuranceCompany.name
								: null,
							premium: safe.award?.toNumber() ?? 0,
							canceledAt: (safe.canceledAt as Date).toISOString(),
							startedAt: safe.requestedAt.toISOString(),
							byEndorsement,
							reason:
								safe.statusMessage ??
								(byEndorsement ? CANCELED_BY_ENDORSEMENT : null),
						};
					}),
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsDashboardCanceled };
