import type { QuoteStatus } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useAnalyticsStatus = (
	type: 'quotes' | 'proposals',
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
	type: 'quotes' | 'proposals',
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

// Propostas: `current` = vencem no período filtrado (o mesmo total da tabela);
// `next` = o mesmo período um ano depois (renovadas ou emitidas para o ano
// seguinte), ou null quando há busca por texto (sem período).
const useAnalyticsProposalsPeriod = ({
	cursor: _cursor,
	limit: _limit,
	...props
}: Record<string, unknown>) =>
	useQuery({
		queryKey: ['proposals', 'analytics', 'count', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<{ current: number; next: number | null }>(
					'/analytics/proposals/count',
					{
						params: props,
						signal,
					},
				)
			).data,
	});

export {
	useAnalyticsProposalsPeriod,
	useAnalyticsStatus,
	useAnalyticsStatusCount,
};
