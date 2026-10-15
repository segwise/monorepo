import type {
	QuoteSimpleCustomRegister,
	QuoteSimpleRegister,
} from '@segwise/core/types';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

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
			throw new Error(error.response?.data.message || 'Falha ao registrar');
		}

		throw error;
	}
}

async function submitQuoteSimpleCustom(props: QuoteSimpleCustomRegister) {
	try {
		const { data } = await api.post<{
			message: string;
		}>('/quotes/simple/custom', props);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao registrar');
		}

		throw error;
	}
}

export { submitQuoteSimple, submitQuoteSimpleCustom };
