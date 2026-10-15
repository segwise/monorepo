import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

interface FinancialSummaryResponse {
	receivableNext30Days: number;
	payableNext30Days: number;
	pendingCommissionFromInsurers: number;
	overdueReceivable: number;
}

// Posição financeira de hoje: não depende do período selecionado no filtro.
const useFinancialSummary = () =>
	useQuery({
		queryKey: ['analytics', 'financial-summary'],
		queryFn: async ({ signal }) =>
			(
				await api.get<FinancialSummaryResponse>(
					'/analytics/dashboard/financial-summary',
					{ signal },
				)
			).data,
	});

export type { FinancialSummaryResponse };
export { useFinancialSummary };
