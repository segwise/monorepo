import type { QuoteSimpleSubmit } from '@/@types/quote/simple';
import { api } from '@/libraries/api';

async function submitQuoteSimple(props: QuoteSimpleSubmit) {
	const { data } = await api.post('/quotes/simple', props);

	return data;
}

export { submitQuoteSimple };
