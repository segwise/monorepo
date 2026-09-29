import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import { api } from '@/libraries/api';
import { periodKey, periodParams } from './period-params';

interface OperationalKpi {
	current: number;
	before: number;
	percent: number;
}

interface OperationalKpisResponse {
	conversionRate: OperationalKpi;
	averageTicket: OperationalKpi;
	averageClosingTimeDays: OperationalKpi;
	forecastedCommission: OperationalKpi;
}

const useOperationalKpis = (period: ResolvedPeriod) =>
	useQuery({
		queryKey: ['analytics', 'operational-kpis', ...periodKey(period)],
		queryFn: async ({ signal }) =>
			(
				await api.get<OperationalKpisResponse>(
					'/analytics/dashboard/operational-kpis',
					{ params: periodParams(period), signal },
				)
			).data,
	});

export { useOperationalKpis };
export type { OperationalKpi, OperationalKpisResponse };
