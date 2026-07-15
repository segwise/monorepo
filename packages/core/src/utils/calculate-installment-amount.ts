import { Decimal } from 'decimal.js';

function calculateInstallmentAmount(
	total: Decimal,
	index: number,
	installments: number,
) {
	const base = total.div(installments);

	if (index === installments - 1) {
		const sumOfPrevious = base.mul(installments - 1);

		return total.sub(sumOfPrevious);
	}

	return base.toDecimalPlaces(2, Decimal.ROUND_DOWN);
}

export { calculateInstallmentAmount };
