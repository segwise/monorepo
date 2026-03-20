import { fetchApi } from '@/functions/api';
import { useQuery } from '@tanstack/react-query';

const useInsuranceCompaniesDetailsById = (id: string) =>
	useQuery({
		queryKey: ['insurance-companies', id, 'details'],
		queryFn: async ({ signal, queryKey }) =>
			await fetchApi.insuranceCompanies.details(queryKey[1], {
				signal,
			}),
		gcTime: Infinity,
		staleTime: Infinity,
	});

export { useInsuranceCompaniesDetailsById };
