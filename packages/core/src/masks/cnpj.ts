import { maskNumber } from './number';

function maskCNPJ(value: string) {
	const clean = maskNumber(value);

	if (clean.length > 14) {
		return clean.slice(0, 14);
	}

	const masked = clean
		.replace(/(\d{2})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1/$2')
		.replace(/(\d{4})(\d{1,2})/, '$1-$2')
		.replace(/(-\d{2})\d+?$/, '$1');
	return masked;
}

export { maskCNPJ };
