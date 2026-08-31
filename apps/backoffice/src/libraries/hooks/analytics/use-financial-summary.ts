import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';

interface FinancialSummaryResponse {
	receivableNext30Days: number;
	payableNext30Days: number;
	pendingCommissionFromInsurers: number;
}

const useFinancialSummary = (period: ResolvedPeriod) =>
	useQuery({
		queryKey: [
			'analytics',
			'financial-summary',
			period.preset,
			period.current.from.toISOString(),
		],
		queryFn: async (): Promise<FinancialSummaryResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			return {
				receivableNext30Days: faker.number.float({
					min: 40000,
					max: 120000,
					fractionDigits: 2,
				}),
				payableNext30Days: faker.number.float({
					min: 10000,
					max: 45000,
					fractionDigits: 2,
				}),
				pendingCommissionFromInsurers: faker.number.float({
					min: 8000,
					max: 30000,
					fractionDigits: 2,
				}),
			};
		},
	});

export { useFinancialSummary };
export type { FinancialSummaryResponse };
