import type {
	ProducerPartnerUpdate,
	ResponseDefault,
} from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

const useProducersUpdate = (id: string) =>
	useMutation<ResponseDefault, Error, ProducerPartnerUpdate>({
		mutationKey: ['producers', 'update', id],
		mutationFn: async (props) => {
			try {
				return (await api.patch<ResponseDefault>(`/producers/${id}`, props))
					.data;
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
	});

export { useProducersUpdate };
