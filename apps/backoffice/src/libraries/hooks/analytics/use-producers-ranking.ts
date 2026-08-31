import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';

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
		queryKey: [
			'analytics',
			'producers-ranking',
			period.preset,
			period.current.from.toISOString(),
			limit,
		],
		queryFn: async (): Promise<ProducersRankingResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			const items: Array<ProducerRankingItem> = Array.from(
				{ length: limit },
				() => ({
					id: faker.string.uuid(),
					name: faker.person.fullName(),
					avatarUrl: faker.image.avatarGitHub(),
					policiesClosed: faker.number.int({ min: 3, max: 40 }),
					commissionGenerated: faker.number.float({
						min: 1500,
						max: 25000,
						fractionDigits: 2,
					}),
				}),
			).sort((a, b) => b.commissionGenerated - a.commissionGenerated);

			return { items };
		},
	});

export { useProducersRanking };
export type { ProducerRankingItem, ProducersRankingResponse };
