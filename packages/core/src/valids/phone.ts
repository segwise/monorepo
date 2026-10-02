import { maskNumber } from '../masks/number';

// DDI só existe quando o número tem mais dígitos que o máximo nacional (DDD +
// 9 dígitos = 11). Número com DDD 55 (RS) sem DDI também começa com "55".
function withoutCountryCode(digits: string) {
	return digits.startsWith('55') && digits.length > 11
		? digits.slice(2)
		: digits;
}

// Celular no formato antigo, de 8 dígitos começando com 9 (ex.: 81 99861630),
// ao qual falta o 9 extra depois do DDD.
function isLegacyMobile(local: string) {
	return local.length === 10 && /^9[0-9]{7}$/.test(local.slice(2));
}

function isPhone(phone: string) {
	const numeroSemDDI = withoutCountryCode(maskNumber(phone));

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
		// 2-8: fixo; 9: celular antigo (ver isLegacyMobile)
		return /^[2-9][0-9]{7}$/.test(numero);
	}

	return false;
}

// Só dígitos; celular antigo ganha o 9 depois do DDD; celular (11 dígitos) ganha
// o DDI 55. Fixo mantém como veio.
function normalizePhone(phone: string) {
	const digits = maskNumber(phone);
	const hasCountryCode = digits.startsWith('55') && digits.length > 11;
	const local = hasCountryCode ? digits.slice(2) : digits;

	const fixed = isLegacyMobile(local)
		? `${local.slice(0, 2)}9${local.slice(2)}`
		: local;

	const result = hasCountryCode ? `55${fixed}` : fixed;

	return result.length === 11 ? `55${result}` : result;
}

export { isPhone, normalizePhone };
