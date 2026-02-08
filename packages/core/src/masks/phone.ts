import { maskNumber } from '@/masks/number';

function maskPhone(phone: string): string {
	const value = maskNumber(phone);

	const truncate = value.length === 13 ? value.slice(2) : value;

	if (truncate.length <= 10) {
		return truncate.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3').slice(0, 15);
	}

	return truncate.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

export { maskPhone };
