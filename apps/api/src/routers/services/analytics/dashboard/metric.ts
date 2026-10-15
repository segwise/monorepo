import { zValidator } from '@hono/zod-validator';
import type { Server } from '@/@types/server';
import { metricSeries, sumSeries } from '@/libraries/dashboard/metrics';
import { percentChange } from '@/libraries/dashboard/range';
import {
	periodRanges,
	requireBrokerId,
	SchemaDashboardMetricKind,
	SchemaDashboardPeriod,
} from './query';

function registerRoutersServicesAnalyticsDashboardMetric(server: Server) {
	server.get(
		'/metric',
		zValidator(
			'query',
			SchemaDashboardPeriod.extend({ kind: SchemaDashboardMetricKind }),
		),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { kind, ...period } = ctx.req.valid('query');
			const { current, reference } = periodRanges(period, ctx.timezone);

			const [currentSeries, referenceSeries] = await Promise.all([
				metricSeries(ctx.database, brokerId, kind, current, ctx.timezone),
				metricSeries(ctx.database, brokerId, kind, reference, ctx.timezone),
			]);

			const currentTotal = sumSeries(currentSeries);
			const referenceTotal = sumSeries(referenceSeries);

			return ctx.json(
				{
					kind,
					comparison: {
						current: currentTotal,
						reference: referenceTotal,
						percent: percentChange(currentTotal, referenceTotal),
					},
					currentSeries,
					referenceSeries,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsDashboardMetric };
