import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';

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

function generateMockKpi(
	min: number,
	max: number,
	fractionDigits = 0,
): OperationalKpi {
	const current = faker.number.float({ min, max, fractionDigits });
	const before = faker.number.float({ min, max, fractionDigits });
	const percent = before === 0 ? 0 : (current - before) / before;

	return { current, before, percent };
}

const useOperationalKpis = (period: ResolvedPeriod) =>
	useQuery({
		queryKey: [
			'analytics',
			'operational-kpis',
			period.preset,
			period.comparisonMode,
			period.current.from.toISOString(),
			period.current.to.toISOString(),
		],
		queryFn: async (): Promise<OperationalKpisResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			return {
				conversionRate: generateMockKpi(0.15, 0.55, 2),
				averageTicket: generateMockKpi(1800, 4200, 0),
				averageClosingTimeDays: generateMockKpi(2, 14, 1),
				forecastedCommission: generateMockKpi(15000, 60000, 0),
			};
		},
	});

export { useOperationalKpis };
export type { OperationalKpi, OperationalKpisResponse };
