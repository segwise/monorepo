import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';
import type { InsuranceMetricKind } from './use-insurance-metrics';

interface NextPeriodProjectionResponse {
	kind: InsuranceMetricKind;
	periodLabel: string;
	projectedValue: number;
	currentPeriodValue: number;
	growthRate: number;
}

const METRIC_RANGE: Record<InsuranceMetricKind, { min: number; max: number }> =
	{
		'policies-count': { min: 1, max: 25 },
		'net-premium': { min: 2000, max: 18000 },
		'quotes-count': { min: 3, max: 60 },
		commission: { min: 300, max: 3500 },
	};

const PERIOD_LABEL: Record<ResolvedPeriod['preset'], string> = {
	'7d': 'Próximos 7 dias',
	'30d': 'Próximos 30 dias',
	month: 'Próximo mês',
	quarter: 'Próximo trimestre',
	custom: 'Próximo período',
};

/**
 * MOCK PROVISÓRIO. Projeta o próximo período equivalente ao selecionado no
 * filtro global (ex: se o usuário está vendo "últimos 30 dias", projeta os
 * próximos 30 dias). Cálculo real ainda a definir — hoje é só um run-rate
 * fake pra ter dado visual.
 */
const useNextPeriodProjection = (
	kind: InsuranceMetricKind,
	period: ResolvedPeriod,
) =>
	useQuery({
		queryKey: ['analytics', 'next-period-projection', kind, period.preset],
		queryFn: async (): Promise<NextPeriodProjectionResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			const { min, max } = METRIC_RANGE[kind];
			const dayCount = Math.max(
				1,
				Math.round(
					(period.current.to.getTime() - period.current.from.getTime()) /
						86_400_000,
				),
			);

			const currentPeriodValue = faker.number.float({
				min: min * dayCount * 0.6,
				max: max * dayCount * 0.6,
				fractionDigits: 0,
			});
			const growthRate = faker.number.float({
				min: -0.08,
				max: 0.18,
				fractionDigits: 3,
			});
			const projectedValue = currentPeriodValue * (1 + growthRate);

			return {
				kind,
				periodLabel: PERIOD_LABEL[period.preset],
				projectedValue,
				currentPeriodValue,
				growthRate,
			};
		},
	});

export { useNextPeriodProjection };
export type { NextPeriodProjectionResponse };
