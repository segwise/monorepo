import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import { api } from '@/libraries/api';
import { periodKey, periodParams } from './period-params';

type InsuranceMetricKind =
	| 'policies-count'
	| 'net-premium'
	| 'quotes-count'
	| 'commission';

interface MetricSeriesPoint {
	date: string;
	value: number;
}

interface MetricComparison {
	current: number;
	reference: number;
	percent: number;
}

interface InsuranceMetricResponse {
	kind: InsuranceMetricKind;
	comparison: MetricComparison;
	currentSeries: Array<MetricSeriesPoint>;
	referenceSeries: Array<MetricSeriesPoint>;
}

const useInsuranceMetric = (
	kind: InsuranceMetricKind,
	period: ResolvedPeriod,
) =>
	useQuery({
		queryKey: ['analytics', 'insurance-metric', kind, ...periodKey(period)],
		queryFn: async ({ signal }) =>
			(
				await api.get<InsuranceMetricResponse>('/analytics/dashboard/metric', {
					params: { kind, ...periodParams(period) },
					signal,
				})
			).data,
	});

export { useInsuranceMetric };
export type {
	InsuranceMetricKind,
	InsuranceMetricResponse,
	MetricSeriesPoint,
	MetricComparison,
};
