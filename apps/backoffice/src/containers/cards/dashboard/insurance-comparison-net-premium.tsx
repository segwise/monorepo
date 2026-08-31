'use client';

import { CardInsuranceComparisonBase } from './insurance-comparison-base';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function CardInsuranceComparisonNetPremium() {
	return (
		<CardInsuranceComparisonBase
			kind='net-premium'
			title='Prêmio Líquido Gerado'
			valueFormatter={currency}
		/>
	);
}

export { CardInsuranceComparisonNetPremium };
