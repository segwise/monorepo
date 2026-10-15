import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { InsuranceMetricKind } from './use-insurance-metrics';

interface YearlyProjectionResponse {
	kind: InsuranceMetricKind;
	targetYear: number;
	projectedValue: number;
	currentYearAccumulated: number;
	growthRate: number;
}

const useYearlyProjection = (kind: InsuranceMetricKind) =>
	useQuery({
		queryKey: ['analytics', 'yearly-projection', kind],
		queryFn: async ({ signal }) =>
			(
				await api.get<YearlyProjectionResponse>(
					'/analytics/dashboard/yearly-projection',
					{ params: { kind }, signal },
				)
			).data,
	});

export type { YearlyProjectionResponse };
export { useYearlyProjection };
