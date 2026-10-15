import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import { api } from '@/libraries/api';
import { periodKey, periodParams } from './period-params';
import type { InsuranceMetricKind } from './use-insurance-metrics';

interface NextPeriodProjectionResponse {
	kind: InsuranceMetricKind;
	periodLabel: string;
	projectedValue: number;
	currentPeriodValue: number;
	growthRate: number;
}

const PERIOD_LABEL: Record<ResolvedPeriod['preset'], string> = {
	'7d': 'Próximos 7 dias',
	'30d': 'Próximos 30 dias',
	month: 'Próximo mês',
	quarter: 'Próximo trimestre',
	year: 'Próximo período',
};

// Projeta um período do mesmo tamanho do selecionado no filtro, usando a
// média diária dos últimos 90 dias.
const useNextPeriodProjection = (
	kind: InsuranceMetricKind,
	period: ResolvedPeriod,
) =>
	useQuery({
		queryKey: [
			'analytics',
			'next-period-projection',
			kind,
			...periodKey(period),
		],
		queryFn: async ({ signal }): Promise<NextPeriodProjectionResponse> => {
			const { from, to } = periodParams(period);

			const data = (
				await api.get<Omit<NextPeriodProjectionResponse, 'periodLabel'>>(
					'/analytics/dashboard/next-period-projection',
					{ params: { kind, from, to }, signal },
				)
			).data;

			return { ...data, periodLabel: PERIOD_LABEL[period.preset] };
		},
	});

export type { NextPeriodProjectionResponse };
export { useNextPeriodProjection };
