'use client';

import { BanknoteIcon } from 'lucide-react';
import { usePeriodFilter } from '@/containers/cards/dashboard/period-filter';
import { useInsuranceMetric } from '@/hooks/analytics/use-insurance-metrics';
import { CardHeaderHome } from '../header-home';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function CardKpiNetPremium() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useInsuranceMetric('net-premium', resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={BanknoteIcon}
			title='Prêmio Líquido Gerado'
			value={data ? currency(data.comparison.current) : 'R$ 0'}
			percent={data?.comparison.percent ?? 0}
			before={data ? currency(data.comparison.reference) : 'R$ 0'}
		/>
	);
}

export { CardKpiNetPremium };
