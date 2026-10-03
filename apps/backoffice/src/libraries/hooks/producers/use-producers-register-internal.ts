import type {
	ProducerRegisterInternal,
	ResponseDefault,
} from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';
import { invalidateProducers } from './invalidate-producers';

const useProducersRegisterInternal = () =>
	useMutation<ResponseDefault, Error, ProducerRegisterInternal>({
		mutationKey: ['producers', 'register', 'internal'],
		mutationFn: async (props) => {
			try {
				return (await api.post<ResponseDefault>('/producers/internal', props))
					.data;
			} catch (error) {
				let message = 'Falha ao registrar';

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

export { useProducersRegisterInternal };
