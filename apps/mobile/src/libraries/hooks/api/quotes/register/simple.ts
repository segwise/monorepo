import { fetchApi } from '@/functions/api';
import type {
	QuoteSimpleCustomRegister,
	QuoteSimpleRegister,
} from '@segwise/core/types';
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

const useQuoteSimpleCustomRegister = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.quotes.register.simpleCustom>>,
		XiorError,
		QuoteSimpleCustomRegister
	>({
		mutationKey: ['quotes', 'simple', 'custom', 'register'],
		mutationFn: fetchApi.quotes.register.simpleCustom,
	});

export { useQuoteSimpleCustomRegister, useQuoteSimpleRegister };
