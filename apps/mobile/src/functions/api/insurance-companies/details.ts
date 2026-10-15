import type { InsuranceCompany } from '@segwise/core/types';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

async function getInsuranceCompaniesById(
	id: string,
	{
		signal,
	}: {
		signal: AbortSignal;
	},
) {
	try {
		const { data } = await api.get<InsuranceCompany>(
			`/insurance-companies/${id}`,
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

export { getInsuranceCompaniesById };
