import type { QuoteRegister, ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

const useQuotesRegister = () =>
	useMutation<ResponseDefault, Error, QuoteRegister>({
		mutationKey: ['quotes', 'register'],
		mutationFn: async (props) => {
			try {
				return (await api.post<ResponseDefault>('/quotes', props)).data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(
						error.response?.data.message || 'Falha ao registrar de cotação',
					);
				}

				throw error;
			}
		},
	});

export { useQuotesRegister };
