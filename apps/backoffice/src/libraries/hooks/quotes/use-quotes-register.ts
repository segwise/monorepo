import type { QuoteRegister, ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useQuotesRegister = () =>
	useMutation<ResponseDefault, Error, QuoteRegister>({
		mutationKey: ['quotes', 'register'],
		mutationFn: async (props) =>
			(await api.post<ResponseDefault>('/quotes', props)).data,
	});

export { useQuotesRegister };
