import { maskNumber } from '@/masks/number';

function maskPostalCode(postalCode: string) {
	postalCode = maskNumber(postalCode);

	postalCode = postalCode.replace(/^(\d{5})(\d)/, '$1-$2');

	return postalCode.slice(0, 9);
}

export { maskPostalCode };
