import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import type { InsuranceMetricKind } from './use-insurance-metrics';

interface YearlyProjectionResponse {
	kind: InsuranceMetricKind;
	targetYear: number;
	projectedValue: number;
	currentYearAccumulated: number;
	growthRate: number;
}

const METRIC_RANGE: Record<InsuranceMetricKind, { min: number; max: number }> =
	{
		'policies-count': { min: 800, max: 2200 },
		'net-premium': { min: 900000, max: 3200000 },
		'quotes-count': { min: 1500, max: 4500 },
		commission: { min: 120000, max: 480000 },
	};

const useYearlyProjection = (kind: InsuranceMetricKind) =>
	useQuery({
		queryKey: ['analytics', 'yearly-projection', kind],
		queryFn: async (): Promise<YearlyProjectionResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			const { min, max } = METRIC_RANGE[kind];
			const currentYearAccumulated = faker.number.float({
				min,
				max,
				fractionDigits: 0,
			});
			const growthRate = faker.number.float({
				min: -0.05,
				max: 0.25,
				fractionDigits: 3,
			});
			const projectedValue = currentYearAccumulated * (1 + growthRate);

			return {
				kind,
				targetYear: new Date().getFullYear() + 1,
				projectedValue,
				currentYearAccumulated,
				growthRate,
			};
		},
	});

export { useYearlyProjection };
export type { YearlyProjectionResponse };
