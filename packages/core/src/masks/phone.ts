import { maskNumber } from './number';

function maskPhone(phone: string) {
	const value = maskNumber(phone);

	if (value.startsWith('0800')) {
		return value.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2-$3').slice(0, 13);
	}

	const truncate = value.length === 13 ? value.slice(2) : value;

	if (truncate.length <= 10) {
		return truncate.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3').slice(0, 15);
	}

	return truncate.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

export { maskPhone };
