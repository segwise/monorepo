import type {
	ProducerInternalUpdate,
	ResponseDefault,
} from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';
import { invalidateProducers } from './invalidate-producers';

const useProducersUpdateInternal = (id: string) =>
	useMutation<ResponseDefault, Error, ProducerInternalUpdate>({
		mutationKey: ['producers', 'update', 'internal', id],
		mutationFn: async (props) => {
			try {
				return (
					await api.patch<ResponseDefault>(`/producers/${id}/internal`, props)
				).data;
			} catch (error) {
				let message = 'Falha ao atualizar';

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

export { useProducersUpdateInternal };
