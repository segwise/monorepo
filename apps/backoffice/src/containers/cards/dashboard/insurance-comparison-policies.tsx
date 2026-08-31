'use client';

import { CardInsuranceComparisonBase } from './insurance-comparison-base';

function CardInsuranceComparisonPolicies() {
	return (
		<CardInsuranceComparisonBase
			kind='policies-count'
			title='Apólices Emitidas'
			valueFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
		/>
	);
}

export { CardInsuranceComparisonPolicies };
