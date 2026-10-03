import type { ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';
import { invalidateProducers } from './invalidate-producers';

const useProducersPendingRenewById = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['producers', 'pending', 'renew', id],
		mutationFn: async () => {
			try {
				return (
					await api.patch<ResponseDefault>(`/producers/pending/${id}/renew`)
				).data;
			} catch (error) {
				let message = 'Falha ao renovar convite';

				if (error instanceof XiorError) {
					if (error.response?.data.message) {
						message = error.response.data.message;
					}
				}

				throw new Error(message);
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidateProducers(ctx.client);
		},
	});

export { useProducersPendingRenewById };
