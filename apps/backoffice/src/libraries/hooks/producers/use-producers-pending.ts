import type { ProducerPending, ProducerPendingKind } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useProducersPending = (kind: ProducerPendingKind | 'all' = 'all') =>
	useQuery({
		queryKey: ['producers', 'pending', kind],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<ProducerPending>>('/producers/pending', {
					params: { kind },
					signal,
				})
			).data,
	});

export { useProducersPending };
