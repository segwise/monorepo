import type { ProducerSimple } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useProducers = ({ simple }: { simple?: boolean } = {}) =>
	useQuery({
		queryKey: [
			'producers',
			{
				simple,
			},
		],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<ProducerSimple>>(
					!simple ? '/producers' : '/producers/simple',
					{
						signal,
					},
				)
			).data,
	});

export { useProducers };
