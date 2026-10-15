import { isQuotePlate } from './is-plate';
import { submitQuoteSimple, submitQuoteSimpleCustom } from './register/simple';

const quotes = {
	register: {
		simple: submitQuoteSimple,
		simpleCustom: submitQuoteSimpleCustom,
	},
	isPlate: isQuotePlate,
};

export { quotes };
