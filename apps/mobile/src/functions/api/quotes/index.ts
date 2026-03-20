import { isQuotePlate } from './is-plate';
import { submitQuoteSimple } from './register/simple';

const quotes = {
	register: {
		simple: submitQuoteSimple,
	},
	isPlate: isQuotePlate,
};

export { quotes };
