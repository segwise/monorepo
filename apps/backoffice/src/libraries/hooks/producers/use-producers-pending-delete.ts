import type { ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useProducersPendingDeleteById = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['producers', 'pending', 'delete', id],
		mutationFn: async () =>
			(await api.delete<ResponseDefault>(`/producers/pending/${id}`)).data,
		async onSuccess(_data, _variables, _result, ctx) {
			await ctx.client.invalidateQueries({
				queryKey: ['producers', 'pending'],
			});
		},
	});

export { useProducersPendingDeleteById };
