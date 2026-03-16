import { fetchApi } from '@/functions/api';
import type { QuoteSimpleRegister } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import type { XiorError } from 'xior';

const useQuoteSimpleRegister = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.quotes.register.simple>>,
		XiorError,
		QuoteSimpleRegister
	>({
		mutationKey: ['quotes', 'simple', 'register'],
		mutationFn: fetchApi.quotes.register.simple,
	});

export { useQuoteSimpleRegister };
