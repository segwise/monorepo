import { zValidator } from '@hono/zod-validator';
import type { Server } from '@/@types/server';
import { productionWhere, quotesWhere } from '@/libraries/dashboard/metrics';
import { buildRange } from '@/libraries/dashboard/range';
import { requireBrokerId, SchemaDashboardPeriod } from './query';

function registerRoutersServicesAnalyticsDashboardConversionFunnel(
	server: Server,
) {
	server.get(
		'/conversion-funnel',
		zValidator('query', SchemaDashboardPeriod.pick({ from: true, to: true })),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { from, to } = ctx.req.valid('query');
			const range = buildRange(from, to, ctx.timezone);

			const quoteWhere = quotesWhere(brokerId, range);

			const [requested, answered, confirmed, proposals] = await Promise.all([
				ctx.database.quote.count({ where: quoteWhere }),
				ctx.database.quote.count({
					where: {
						...quoteWhere,
						status: { in: ['quoted', 'sent', 'confirmed'] },
					},
				}),
				ctx.database.quote.count({
					where: { ...quoteWhere, status: 'confirmed' },
				}),
				ctx.database.safe.count({
					where: productionWhere(ctx.database, brokerId, range),
				}),
			]);

			return ctx.json(
				{
					stages: [
						{
							stage: 'quotes',
							label: 'Cotações solicitadas',
							value: requested,
						},
						{
							stage: 'answered',
							label: 'Cotações respondidas',
							value: answered,
						},
						{
							stage: 'confirmed',
							label: 'Cotações confirmadas',
							value: confirmed,
						},
						{ stage: 'proposals', label: 'Propostas', value: proposals },
					],
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsDashboardConversionFunnel };
