import { maskNumber } from '../number';

function maskDateString(value: string) {
	return maskNumber(value)
		.replace(/(\d{2})(\d)/, '$1/$2')
		.replace(/(\d{2})(\d)/, '$1/$2')
		.slice(0, 10);
}
export { maskDateString };
