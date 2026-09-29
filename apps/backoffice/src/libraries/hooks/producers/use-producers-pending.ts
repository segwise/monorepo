import type { ProducerPending, ProducerPendingKind } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useProducersPending = (
	kind: ProducerPendingKind | 'all' = 'all',
	from?: string | null,
	to?: string | null,
) =>
	useQuery({
		queryKey: ['producers', 'pending', kind, from, to],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<ProducerPending>>('/producers/pending', {
					params: { kind, ...(from && { from }), ...(to && { to }) },
					signal,
				})
			).data,
	});

export { useProducersPending };
