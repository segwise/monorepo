import { zValidator } from '@hono/zod-validator';
import type { Server } from '@/@types/server';
import { productionWhere } from '@/libraries/dashboard/metrics';
import { buildRange } from '@/libraries/dashboard/range';
import { requireBrokerId, SchemaDashboardPeriod } from './query';

const TOP = 5;

function registerRoutersServicesAnalyticsDashboardInsuranceDistribution(
	server: Server,
) {
	server.get(
		'/insurance-distribution',
		zValidator('query', SchemaDashboardPeriod.pick({ from: true, to: true })),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { from, to } = ctx.req.valid('query');
			const range = buildRange(from, to, ctx.timezone);

			const grouped = await ctx.database.safe.groupBy({
				by: ['insuranceCompanyId'],
				where: productionWhere(ctx.database, brokerId, range),
				_count: { _all: true },
				orderBy: { _count: { insuranceCompanyId: 'desc' } },
			});

			const total = grouped.reduce((sum, item) => sum + item._count._all, 0);

			const companies = await ctx.database.insuranceCompany.findMany({
				where: {
					id: {
						in: grouped
							.slice(0, TOP)
							.map((item) => item.insuranceCompanyId)
							.filter((id): id is string => !!id),
					},
				},
				select: { id: true, name: true, fantasy: true },
			});

			const namesById = new Map(
				companies.map((company) => [
					company.id,
					company.fantasy || company.name,
				]),
			);

			const items = grouped.slice(0, TOP).map((item) => ({
				id: item.insuranceCompanyId ?? 'unknown',
				name: item.insuranceCompanyId
					? (namesById.get(item.insuranceCompanyId) ?? 'Seguradora')
					: 'Sem seguradora',
				total: item._count._all,
				percent: total ? item._count._all / total : 0,
			}));

			const othersTotal = grouped
				.slice(TOP)
				.reduce((sum, item) => sum + item._count._all, 0);

			if (othersTotal) {
				items.push({
					id: 'others',
					name: 'Outras',
					total: othersTotal,
					percent: total ? othersTotal / total : 0,
				});
			}

			return ctx.json({ total, items }, 200);
		},
	);
}

export { registerRoutersServicesAnalyticsDashboardInsuranceDistribution };
