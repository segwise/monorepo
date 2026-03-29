import type { QuoteStatus } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/quotes';

const useQuotesAnalyticsCount = (
	props: Omit<SearchParamsProps, 'type' | 'status'> & {
		type: 'year' | 'month';
	},
) =>
	useQuery({
		queryKey: ['quotes', 'analytics', 'count', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<{ current: number; before: number }>(
					'/analytics/quotes/count',
					{
						params: props,
						signal,
					},
				)
			).data,
	});

const useQuotesAnalyticsStatus = (
	props: Omit<SearchParamsProps, 'type' | 'status'> & {
		type: 'year' | 'month';
		status: Array<QuoteStatus>;
	},
) =>
	useQuery({
		queryKey: ['quotes', 'analytics', 'status', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<{ current: number; before: number }>(
					'/analytics/quotes/status',
					{
						params: props,
						signal,
					},
				)
			).data,
	});

export { useQuotesAnalyticsCount, useQuotesAnalyticsStatus };
