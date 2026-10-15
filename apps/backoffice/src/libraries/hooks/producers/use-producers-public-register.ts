import type {
	ProducerPublicRegister,
	ResponseDefault,
} from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

const useProducersPublicRegister = (slug: string) =>
	useMutation<ResponseDefault, Error, ProducerPublicRegister>({
		mutationKey: ['producers', 'public', 'register', slug],
		mutationFn: async (props) => {
			try {
				return (
					await api.post<ResponseDefault>(`/producers/public/${slug}`, props)
				).data;
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
	});

export { useProducersPublicRegister };
