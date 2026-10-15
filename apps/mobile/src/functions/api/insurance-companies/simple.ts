import type { InsuranceCompanySimple } from '@segwise/core/types';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

async function getInsuranceCompaniesSimple({
	signal,
}: {
	signal: AbortSignal;
}) {
	try {
		const { data } = await api.get<Array<InsuranceCompanySimple>>(
			`/insurance-companies/simple`,
			{
				signal,
			},
		);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(
				error.response?.data?.message || 'Falha ao consultar seguradora',
			);
		}

		throw error;
	}
}

export { getInsuranceCompaniesSimple };
