import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import type {
	DateRange,
	ResolvedPeriod,
} from '@/containers/cards/dashboard/period-filter';

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

const METRIC_RANGE: Record<InsuranceMetricKind, { min: number; max: number }> =
	{
		'policies-count': { min: 1, max: 25 },
		'net-premium': { min: 2000, max: 18000 },
		'quotes-count': { min: 3, max: 60 },
		commission: { min: 300, max: 3500 },
	};

function eachDay(range: DateRange): Array<Date> {
	const days: Array<Date> = [];
	const cursor = new Date(range.from);

	while (cursor <= range.to) {
		days.push(new Date(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}

	return days;
}

function generateSeries(
	range: DateRange,
	kind: InsuranceMetricKind,
): Array<MetricSeriesPoint> {
	const { min, max } = METRIC_RANGE[kind];

	return eachDay(range).map((date) => ({
		date: date.toISOString().slice(0, 10),
		value: faker.number.float({ min, max, fractionDigits: 0 }),
	}));
}

function sum(series: Array<MetricSeriesPoint>) {
	return series.reduce((acc, point) => acc + point.value, 0);
}

const useInsuranceMetric = (
	kind: InsuranceMetricKind,
	period: ResolvedPeriod,
) =>
	useQuery({
		queryKey: [
			'analytics',
			'insurance-metric',
			kind,
			period.preset,
			period.comparisonMode,
			period.current.from.toISOString(),
			period.current.to.toISOString(),
		],
		queryFn: async (): Promise<InsuranceMetricResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			const currentSeries = generateSeries(period.current, kind);
			const referenceSeries = generateSeries(period.reference, kind);

			const current = sum(currentSeries);
			const reference = sum(referenceSeries);
			const percent = reference === 0 ? 0 : (current - reference) / reference;

			return {
				kind,
				comparison: { current, reference, percent },
				currentSeries,
				referenceSeries,
			};
		},
	});

export { useInsuranceMetric };
export type {
	InsuranceMetricKind,
	InsuranceMetricResponse,
	MetricSeriesPoint,
	MetricComparison,
};
