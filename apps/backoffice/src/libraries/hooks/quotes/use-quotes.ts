import type { QuoteSimple, ResponseDataCursor } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/quotes';

const useQuotesSimple = (props: SearchParamsProps) =>
	useQuery({
		queryKey: ['quotes', 'simple', props],
		queryFn: async ({ signal }) => {
			const response = (
				await api.get<ResponseDataCursor<QuoteSimple>>('/quotes/simple', {
					params: props,
					signal,
				})
			).data;

			return response;
		},
	});

export { useQuotesSimple };
