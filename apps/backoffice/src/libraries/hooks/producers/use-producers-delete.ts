import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

type ResponseDelete = { action: 'deleted' | 'suspended'; message: string };

const useProducersDeleteById = (id: string) =>
	useMutation<ResponseDelete, Error>({
		mutationKey: ['producers', 'delete', id],
		mutationFn: async () =>
			(await api.delete<ResponseDelete>(`/producers/${id}`)).data,
		async onSuccess(_data, _variables, _result, ctx) {
			await ctx.client.invalidateQueries({ queryKey: ['producers'] });
		},
	});

export { useProducersDeleteById };
