import { fetchApi } from '@/functions/api';
import { useQuery } from '@tanstack/react-query';

const useInsuranceCompaniesSimple = () =>
	useQuery({
		queryKey: ['insurance-companies', 'simple'],
		queryFn: fetchApi.insuranceCompanies.simple,
		gcTime: Infinity,
		staleTime: Infinity,
	});

export { useInsuranceCompaniesSimple };
