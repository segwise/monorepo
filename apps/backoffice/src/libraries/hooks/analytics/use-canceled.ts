import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import { api } from '@/libraries/api';
import { periodKey, periodParams } from './period-params';

interface CanceledComparison {
	current: number;
	reference: number;
	percent: number;
}

interface CanceledItem {
	id: string;
	insured: string;
	plate: string | null;
	insuranceCompany: string | null;
	premium: number;
	canceledAt: string;
	startedAt: string;
	byEndorsement: boolean;
	reason: string | null;
}

interface CanceledResponse {
	count: CanceledComparison;
	premium: CanceledComparison;
	items: Array<CanceledItem>;
}

const useCanceled = (period: ResolvedPeriod, limit = 8) =>
	useQuery({
		queryKey: ['analytics', 'canceled', ...periodKey(period), limit],
		queryFn: async ({ signal }) =>
			(
				await api.get<CanceledResponse>('/analytics/dashboard/canceled', {
					params: { ...periodParams(period), limit },
					signal,
				})
			).data,
	});

export type { CanceledComparison, CanceledItem, CanceledResponse };
export { useCanceled };
