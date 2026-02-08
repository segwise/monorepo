import { maskNumber } from '../masks';

function isPhone(phone: string): boolean {
	const apenasNumeros = maskNumber(phone);

	let numeroSemDDI = apenasNumeros;
	if (numeroSemDDI.startsWith('55')) {
		numeroSemDDI = numeroSemDDI.slice(2);
	}

	if (numeroSemDDI.length < 10 || numeroSemDDI.length > 11) {
		return false;
	}

	const ddd = numeroSemDDI.slice(0, 2);
	const numero = numeroSemDDI.slice(2);

	if (!/^[1-9][0-9]$/.test(ddd)) {
		return false;
	}

	if (numero.length === 9) {
		return /^9[0-9]{8}$/.test(numero);
	}

	if (numero.length === 8) {
		return /^[2-8][0-9]{7}$/.test(numero);
	}

	return false;
}

export { isPhone };
