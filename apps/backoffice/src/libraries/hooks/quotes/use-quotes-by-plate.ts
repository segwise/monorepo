import type { QuoteRegister } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

const useQuotesByPlate = () =>
	useMutation<QuoteRegister, Error, string>({
		mutationKey: ['quotes', 'plate'],
		mutationFn: async (plate) => {
			try {
				return (await api.get(`/quotes/${plate}`)).data;
			} catch (error) {
				let message = 'Falha ao consultar';

				if (error instanceof XiorError) {
					if (error.response?.data.message) {
						message = error.response.data.message;
					}
				}

				throw new Error(message);
			}
		},
	});

export { useQuotesByPlate };
