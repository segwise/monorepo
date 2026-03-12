import type { QuoteSimpleSubmit } from '@/@types/quote/simple';
import { fetchApi } from '@/functions/api';
import { useMutation } from '@tanstack/react-query';
import type { XiorError } from 'xior';

const useSubmitQuoteSimple = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.quotes.submit.simple>>,
		XiorError,
		QuoteSimpleSubmit
	>({
		mutationKey: ['quotes', 'simple', 'submit'],
		mutationFn: fetchApi.quotes.submit.simple,
	});

export { useSubmitQuoteSimple };
