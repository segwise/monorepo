import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import { api } from '@/libraries/api';
import { periodKey, periodParams } from './period-params';

interface ProducerRankingItem {
	id: string;
	name: string;
	avatarUrl?: string;
	policiesClosed: number;
	commissionGenerated: number;
}

interface ProducersRankingResponse {
	items: Array<ProducerRankingItem>;
}

const useProducersRanking = (period: ResolvedPeriod, limit = 5) =>
	useQuery({
		queryKey: ['analytics', 'producers-ranking', ...periodKey(period), limit],
		queryFn: async ({ signal }) => {
			const { from, to } = periodParams(period);

			return (
				await api.get<ProducersRankingResponse>(
					'/analytics/dashboard/producers-ranking',
					{ params: { from, to, limit }, signal },
				)
			).data;
		},
	});

export { useProducersRanking };
export type { ProducerRankingItem, ProducersRankingResponse };
