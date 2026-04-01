import type { ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useQuotesDeleteById = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['quotes', 'delete', id],
		mutationFn: async () =>
			(await api.delete<ResponseDefault>(`/quotes/${id}`)).data,
		async onSuccess(_data, _variables, _result, ctx) {
			setTimeout(async () => {
				await ctx.client.invalidateQueries({
					queryKey: ['quotes'],
				});
			}, 300);
		},
	});

export { useQuotesDeleteById };
