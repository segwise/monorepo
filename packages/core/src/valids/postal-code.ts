import { maskNumber } from '@/masks/number';

function isPostalCode(postalCode: string) {
	const cleaned = maskNumber(postalCode);

	if (cleaned.length !== 8) {
		return false;
	}

	const invalidPatterns = [
		/^00000000$/,
		/^11111111$/,
		/^22222222$/,
		/^33333333$/,
		/^44444444$/,
		/^55555555$/,
		/^66666666$/,
		/^77777777$/,
		/^88888888$/,
		/^99999999$/,
	];

	return !invalidPatterns.some((pattern) => pattern.test(cleaned));
}

export { isPostalCode };
