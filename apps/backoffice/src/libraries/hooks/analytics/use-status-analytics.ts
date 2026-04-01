import type { QuoteStatus } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useAnalyticsStatus = (
	type: 'quotes' | 'proposals' | 'policies',
	{
		cursor: _cursor,
		limit: _limit,
		...props
	}: Record<string, unknown> & {
		status: Array<QuoteStatus>;
	},
) =>
	useQuery({
		queryKey: [type, 'analytics', 'status', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<{ current: number; before: number }>(
					`/analytics/${type}/status`,
					{
						params: props,
						signal,
					},
				)
			).data,
	});

const useAnalyticsStatusCount = (
	type: 'quotes' | 'proposals' | 'policies',
	{
		cursor: _cursor,
		limit: _limit,
		...props
	}: Record<string, unknown> & {
		status: Array<QuoteStatus>;
	},
) =>
	useQuery({
		queryKey: [type, 'analytics', 'count', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<{ current: number; before: number }>(
					`/analytics/${type}/count`,
					{
						params: props,
						signal,
					},
				)
			).data,
	});

export { useAnalyticsStatus, useAnalyticsStatusCount };
