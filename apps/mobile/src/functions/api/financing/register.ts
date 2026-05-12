import { api } from '@/libraries/api';
import type { QuoteFinancingRegister } from '@segwise/core/types';
import { XiorError } from 'xior';

async function submitFinancing(props: QuoteFinancingRegister) {
	try {
		const { data } = await api.post<
			{
				quote: string;
				safe?: string;
			} & {
				message: string;
			}
		>('/quote-financing', props);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao registrar');
		}

		throw error;
	}
}

export { submitFinancing };
