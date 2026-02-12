import type { QuoteSimple, ResponseDataCursor } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useQuotesSimple = ({ simple }: { simple?: boolean } = {}) =>
	useQuery({
		queryKey: [
			'quotes',
			{
				simple,
			},
		],
		queryFn: async ({ signal }) =>
			(
				await api.get<ResponseDataCursor<QuoteSimple>>(
					!simple ? '/quotes' : '/quotes/simple',
					{
						signal,
					},
				)
			).data,
	});

export { useQuotesSimple };
