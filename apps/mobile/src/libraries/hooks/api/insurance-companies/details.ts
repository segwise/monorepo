import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/functions/api';

const useInsuranceCompaniesDetailsById = (id: string) =>
	useQuery({
		queryKey: ['insurance-companies', id, 'details'],
		queryFn: async ({ signal, queryKey }) =>
			await fetchApi.insuranceCompanies.details(queryKey[1], {
				signal,
			}),
	});

export { useInsuranceCompaniesDetailsById };
