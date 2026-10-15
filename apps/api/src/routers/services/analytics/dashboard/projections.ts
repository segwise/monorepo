import { zValidator } from '@hono/zod-validator';
import {
	endOfMonth,
	getYear,
	startOfMonth,
	subMonths,
	subYears,
} from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import {
	cappedTotal,
	median,
	metricSeries,
	monthlyTotals,
	sumSeries,
} from '@/libraries/dashboard/metrics';
import { buildRange } from '@/libraries/dashboard/range';
import {
	requireBrokerId,
	SchemaDashboardMetricKind,
	SchemaDashboardPeriod,
} from './query';

// Crescimento fora dessa faixa distorce a projeção (base pequena).
const GROWTH_MIN = -0.3;
const GROWTH_MAX = 0.3;

const clamp = (value: number) =>
	Math.min(GROWTH_MAX, Math.max(GROWTH_MIN, value));

const AVERAGE_MONTH_DAYS = 30.44;

function registerRoutersServicesAnalyticsDashboardProjections(server: Server) {
	// Próximos 12 meses = últimos 12 meses (calendário, incluindo o atual) ×
	// crescimento sobre os 12 meses anteriores. Cada mês é limitado a
	// 0,5×–1,5× a mediana para um mês atípico não distorcer o resultado.
	// "Acumulado" é o ano corrente até o fim do mês atual.
	server.get(
		'/yearly-projection',
		zValidator('query', z.object({ kind: SchemaDashboardMetricKind })),
		async (ctx) => {
			const brokerId = requireBrokerId(ctx);
			const { kind } = ctx.req.valid('query');
			const now = new Date();

			const months = async (from: Date, to: Date) =>
				monthlyTotals(
					await metricSeries(
						ctx.database,
						brokerId,
						kind,
						buildRange(from, to, ctx.timezone),
						ctx.timezone,
					),
				);

			const last12Start = startOfMonth(subMonths(now, 11));
			const monthEnd = endOfMonth(now);

			const [accumulated, last12, previous12] = await Promise.all([
				months(new Date(getYear(now), 0, 1), monthEnd),
				months(last12Start, monthEnd),
				months(subYears(last12Start, 1), subYears(monthEnd, 1)),
			]);

			const last12Total = cappedTotal(last12);
			const previous12Total = cappedTotal(previous12);

			const growthRate = previous12Total
				? clamp((last12Total - previous12Total) / previous12Total)
				: 0;

			return ctx.json(
				{
					kind,
					targetYear: getYear(now) + 1,
					projectedValue: last12Total * (1 + growthRate),
					currentYearAccumulated: accumulated.reduce((a, b) => a + b, 0),
					growthRate,
				},
				200,
			);
		},
	);

	// Próximo período (mesma duração do selecionado) = mediana dos últimos 6
	// meses fechados, proporcional aos dias do período.
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
				startOfMonth(subMonths(now, 6)),
				endOfMonth(subMonths(now, 1)),
				ctx.timezone,
			);

			const [currentSeries, recentSeries] = await Promise.all([
				metricSeries(ctx.database, brokerId, kind, period, ctx.timezone),
				metricSeries(ctx.database, brokerId, kind, recent, ctx.timezone),
			]);

			const currentPeriodValue = sumSeries(currentSeries);
			const projectedValue =
				(median(monthlyTotals(recentSeries)) / AVERAGE_MONTH_DAYS) *
				period.days.length;

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
