import { fetchApi } from '@/functions/api';
import { useQuery } from '@tanstack/react-query';

const useInsuranceCompaniesSimple = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['insurance-companies', 'simple'],
		queryFn: fetchApi.insuranceCompanies.simple,
		enabled,
	});

export { useInsuranceCompaniesSimple };
