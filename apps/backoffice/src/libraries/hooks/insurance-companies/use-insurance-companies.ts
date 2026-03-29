import type { InsuranceCompanySimple } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

type UseInsuranceCompaniesProps = {
	enabled: boolean;
};

const useInsuranceCompaniesSimple = ({
	enabled,
}: Partial<UseInsuranceCompaniesProps> = {}) =>
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
		enabled,
	});

export { useInsuranceCompaniesSimple };
