import { maskNumber } from '@/masks/number';

function isCPF(cpf: string): boolean {
	cpf = maskNumber(cpf);

	if (cpf.length !== 11) return false;
	if (/^(\d)\1{10}$/.test(cpf)) return false;

	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += Number(cpf[i]) * (10 - i);
	}
	let digit = 11 - (sum % 11);
	if (digit === 10 || digit === 11) digit = 0;
	if (digit !== Number(cpf[9])) return false;

	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += Number(cpf[i]) * (11 - i);
	}
	digit = 11 - (sum % 11);
	if (digit === 10 || digit === 11) digit = 0;
	if (digit !== Number(cpf[10])) return false;

	return true;
}

export { isCPF };
