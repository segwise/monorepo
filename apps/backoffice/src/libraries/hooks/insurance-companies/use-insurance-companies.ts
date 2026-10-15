import type { InsuranceCompanySimple } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/insurance-companies';

type UseInsuranceCompaniesProps = {
	enabled?: boolean;
};

const useInsuranceCompaniesSimple = (
	props: Partial<SearchParamsProps> = {},
	{ enabled = true }: UseInsuranceCompaniesProps = {},
) =>
	useQuery({
		queryKey: ['insurance-companies', 'simple', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<InsuranceCompanySimple>>(
					'/insurance-companies/simple',
					{
						params: props,
						signal,
					},
				)
			).data,
		enabled,
	});

export { useInsuranceCompaniesSimple };
