import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import { api } from '@/libraries/api';
import { periodKey, periodParams } from './period-params';

interface InsuranceDistributionItem {
	id: string;
	name: string;
	total: number;
	percent: number;
}

interface InsuranceDistributionResponse {
	total: number;
	items: Array<InsuranceDistributionItem>;
}

const useInsuranceDistribution = (period: ResolvedPeriod) =>
	useQuery({
		queryKey: ['analytics', 'insurance-distribution', ...periodKey(period)],
		queryFn: async ({ signal }) => {
			const { from, to } = periodParams(period);

			return (
				await api.get<InsuranceDistributionResponse>(
					'/analytics/dashboard/insurance-distribution',
					{ params: { from, to }, signal },
				)
			).data;
		},
	});

export type { InsuranceDistributionItem, InsuranceDistributionResponse };
export { useInsuranceDistribution };
