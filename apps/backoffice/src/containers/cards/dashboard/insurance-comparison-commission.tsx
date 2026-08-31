'use client';

import { CardInsuranceComparisonBase } from './insurance-comparison-base';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function CardInsuranceComparisonCommission() {
	return (
		<CardInsuranceComparisonBase
			kind='commission'
			title='Comissão Gerada'
			valueFormatter={currency}
		/>
	);
}

export { CardInsuranceComparisonCommission };
