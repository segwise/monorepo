import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import { api } from '@/libraries/api';
import { periodKey, periodParams } from './period-params';

interface ConversionFunnelStage {
	stage: 'quotes' | 'answered' | 'confirmed' | 'proposals';
	label: string;
	value: number;
}

interface ConversionFunnelResponse {
	stages: Array<ConversionFunnelStage>;
}

const useConversionFunnel = (period: ResolvedPeriod) =>
	useQuery({
		queryKey: ['analytics', 'conversion-funnel', ...periodKey(period)],
		queryFn: async ({ signal }) => {
			const { from, to } = periodParams(period);

			return (
				await api.get<ConversionFunnelResponse>(
					'/analytics/dashboard/conversion-funnel',
					{ params: { from, to }, signal },
				)
			).data;
		},
	});

export type { ConversionFunnelResponse, ConversionFunnelStage };
export { useConversionFunnel };
