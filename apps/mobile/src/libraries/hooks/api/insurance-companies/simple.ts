import { fetchApi } from '@/functions/api';
import { useQuery } from '@tanstack/react-query';

const useInsuranceCompaniesSimple = () =>
	useQuery({
		queryKey: ['insurance-companies', 'simple'],
		queryFn: fetchApi.insuranceCompanies.simple,
	});

export { useInsuranceCompaniesSimple };
