import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/functions/api';

const useInsuranceCompaniesSimple = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['insurance-companies', 'simple'],
		queryFn: fetchApi.insuranceCompanies.simple,
		enabled,
	});

export { useInsuranceCompaniesSimple };
