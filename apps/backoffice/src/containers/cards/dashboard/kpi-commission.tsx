'use client';

import { CoinsIcon } from 'lucide-react';
import { usePeriodFilter } from '@/containers/cards/dashboard/period-filter';
import { useInsuranceMetric } from '@/hooks/analytics/use-insurance-metrics';
import { CardHeaderHome } from '../header-home';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function CardKpiCommission() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useInsuranceMetric('commission', resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={CoinsIcon}
			title='Comissão Gerada'
			value={data ? currency(data.comparison.current) : 'R$ 0'}
			percent={data?.comparison.percent ?? 0}
			before={data ? currency(data.comparison.reference) : 'R$ 0'}
		/>
	);
}

export { CardKpiCommission };
