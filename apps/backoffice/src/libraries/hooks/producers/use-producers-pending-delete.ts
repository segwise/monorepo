import type { ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import { invalidateProducers } from './invalidate-producers';

const useProducersPendingDeleteById = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['producers', 'pending', 'delete', id],
		mutationFn: async () =>
			(await api.delete<ResponseDefault>(`/producers/pending/${id}`)).data,
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidateProducers(ctx.client);
		},
	});

export { useProducersPendingDeleteById };
