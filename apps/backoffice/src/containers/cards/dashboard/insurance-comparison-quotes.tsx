'use client';

import { CardInsuranceComparisonBase } from './insurance-comparison-base';

function CardInsuranceComparisonQuotes() {
	return (
		<CardInsuranceComparisonBase
			kind='quotes-count'
			title='Cotações Geradas'
			valueFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
		/>
	);
}

export { CardInsuranceComparisonQuotes };
