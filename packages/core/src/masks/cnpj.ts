import { maskNumber } from './number';

function maskCNPJ(value: string): string {
	return maskNumber(value)
		.replace(/(\d{2})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})(\d)/, '$1/$2')
		.replace(/(\d{4})(\d{1,2})/, '$1-$2')
		.replace(/(-\d{2})\d+?$/, '$1');
}

export { maskCNPJ };
