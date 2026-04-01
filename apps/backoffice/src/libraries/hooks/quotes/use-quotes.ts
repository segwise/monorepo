import type { QuoteSimple, ResponseDataCursor } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/quotes';

const useQuotesSimple = (props: Omit<SearchParamsProps, 'basisOfAnalysis'>) =>
	useQuery({
		queryKey: ['quotes', 'simple', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<ResponseDataCursor<QuoteSimple>>('/quotes/simple', {
					params: props,
					signal,
				})
			).data,
	});

export { useQuotesSimple };
