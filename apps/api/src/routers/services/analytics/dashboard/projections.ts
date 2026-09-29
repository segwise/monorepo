import { zValidator } from '@hono/zod-validator';
import { getYear, subDays, subYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import { metricSeries, sumSeries } from '@/libraries/dashboard/metrics';
import { buildRange } from '@/libraries/dashboard/range';
import {
	requireBrokerId,
	SchemaDashboardMetricKind,
	SchemaDashboardPeriod,
} from './query';

// Crescimento fora dessa faixa distorce a projeção (base pequena).
const GROWTH_MIN = -0.5;
const GROWTH_MAX = 1;
const RUN_RATE_DAYS = 90;

const clamp = (value: number) =>
	Math.min(GROWTH_MAX, Math.max(GROWTH_MIN, value));

function registerRoutersServicesAnalyticsDashboardProjections(server: Server) {
	// Próximos 12 meses = últimos 12 meses × crescimento sobre os 12 meses
	// anteriores. "Acumulado" é o ano corrente até hoje.
	server.get(
		'/yearly-projection',
		zValidator('query', z.object({ kind: SchemaDashboardMetricKind })),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { kind } = ctx.req.valid('query');
			const now = new Date();

			const total = async (from: Date, to: Date) =>
				sumSeries(
					await metricSeries(
						ctx.database,
						brokerId,
						kind,
						buildRange(from, to, ctx.timezone),
						ctx.timezone,
					),
				);

			const startOfYear = new Date(getYear(now), 0, 1);
			const last12 = subDays(now, 364);

			const [accumulated, last12Months, previous12Months] = await Promise.all([
				total(startOfYear, now),
				total(last12, now),
				total(subYears(last12, 1), subYears(now, 1)),
			]);

			const growthRate = previous12Months
				? clamp((last12Months - previous12Months) / previous12Months)
				: 0;

			return ctx.json(
				{
					kind,
					targetYear: getYear(now) + 1,
					projectedValue: last12Months * (1 + growthRate),
					currentYearAccumulated: accumulated,
					growthRate,
				},
				200,
			);
		},
	);

	// Próximo período (mesma duração do selecionado) = média diária dos
	// últimos 90 dias × dias do período.
	server.get(
		'/next-period-projection',
		zValidator(
			'query',
			SchemaDashboardPeriod.pick({ from: true, to: true }).extend({
				kind: SchemaDashboardMetricKind,
			}),
		),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { kind, from, to } = ctx.req.valid('query');
			const now = new Date();

			const period = buildRange(from, to, ctx.timezone);
			const recent = buildRange(
				subDays(now, RUN_RATE_DAYS - 1),
				now,
				ctx.timezone,
			);

			const [currentSeries, recentSeries] = await Promise.all([
				metricSeries(ctx.database, brokerId, kind, period, ctx.timezone),
				metricSeries(ctx.database, brokerId, kind, recent, ctx.timezone),
			]);

			const currentPeriodValue = sumSeries(currentSeries);
			const projectedValue =
				(sumSeries(recentSeries) / RUN_RATE_DAYS) * period.days.length;

			return ctx.json(
				{
					kind,
					projectedValue,
					currentPeriodValue,
					growthRate: currentPeriodValue
						? projectedValue / currentPeriodValue - 1
						: 0,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsDashboardProjections };
