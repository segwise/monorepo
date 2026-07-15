import { maskNumber } from '@/masks/number';

function isCNPJ(cnpj: string): boolean {
	cnpj = maskNumber(cnpj);

	if (cnpj.length !== 14) return false;
	if (/^(\d)\1{13}$/.test(cnpj)) return false;

	const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		sum += Number(cnpj[i]) * (weights1[i] as number);
	}
	let digit = 11 - (sum % 11);
	if (digit >= 10) digit = 0;
	if (digit !== Number(cnpj[12])) return false;

	const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	sum = 0;
	for (let i = 0; i < 13; i++) {
		sum += Number(cnpj[i]) * (weights2[i] as number);
	}
	digit = 11 - (sum % 11);
	if (digit >= 10) digit = 0;
	if (digit !== Number(cnpj[13])) return false;

	return true;
}

export { isCNPJ };
