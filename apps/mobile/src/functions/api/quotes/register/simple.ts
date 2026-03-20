import { api } from '@/libraries/api';
import type { QuoteSimpleRegister } from '@segwise/core/types';
import { XiorError } from 'xior';

async function submitQuoteSimple(props: QuoteSimpleRegister) {
	try {
		const { data } = await api.post<
			{
				quote: string;
				safe?: string;
			} & {
				message: string;
			}
		>('/quotes/simple?asResponse=true', props);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			console.log(error.response);
			throw new Error(error.response?.data.message || 'Falha ao registrar');
		}

		throw error;
	}
}

export { submitQuoteSimple };
