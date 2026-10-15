import { maskNumber } from '../masks/number';

function isCNPJ(value: string) {
	const cnpj = maskNumber(value);

	if (cnpj.length !== 14) {
		return false;
	}

	if (/^(\d)\1{13}$/.test(cnpj)) {
		return false;
	}

	let sum = 0;
	let weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

	for (let i = 0; i < 12; i++) {
		sum += Number(cnpj[i]) * (weights[i] as number);
	}

	let digit = 11 - (sum % 11);

	if (digit === 10 || digit === 11) {
		digit = 0;
	}

	if (digit !== Number(cnpj[12])) {
		return false;
	}

	sum = 0;
	weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

	for (let i = 0; i < 13; i++) {
		sum += Number(cnpj[i]) * (weights[i] as number);
	}

	digit = 11 - (sum % 11);

	if (digit === 10 || digit === 11) {
		digit = 0;
	}

	if (digit !== Number(cnpj[13])) {
		return false;
	}

	return true;
}

export { isCNPJ };
