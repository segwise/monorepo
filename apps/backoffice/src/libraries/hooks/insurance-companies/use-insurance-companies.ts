import type { InsuranceCompanySimple } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useInsuranceCompaniesSimple = () =>
	useQuery({
		queryKey: ['insurance-companies', 'simple'],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<InsuranceCompanySimple>>(
					'/insurance-companies/simple',
					{
						signal,
					},
				)
			).data,
	});

export { useInsuranceCompaniesSimple };
