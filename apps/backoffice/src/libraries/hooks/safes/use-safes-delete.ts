import type { ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useSafesDeleteById = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['safes', 'delete', id],
		mutationFn: async () =>
			(await api.delete<ResponseDefault>(`/safes/${id}`)).data,
		async onSuccess(_data, _variables, _result, ctx) {
			setTimeout(async () => {
				await Promise.all([
					ctx.client.invalidateQueries({
						queryKey: ['proposals'],
					}),
				]);
			}, 150);
		},
	});

export { useSafesDeleteById };
