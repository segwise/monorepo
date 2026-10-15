'use client';

import { CoinsIcon } from 'lucide-react';
import { useOperationalKpis } from '@/hooks/analytics/use-operational-kpis';
import { CardHeaderHome } from '../header-home';
import { usePeriodFilter } from './period-filter';

function CardKpiForecastedCommission() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useOperationalKpis(resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={CoinsIcon}
			title='Comissão Prevista'
			value={
				data
					? new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
							maximumFractionDigits: 0,
						}).format(data.forecastedCommission.current)
					: 'R$ 0'
			}
			percent={data?.forecastedCommission.percent ?? 0}
			before={
				data
					? new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
							maximumFractionDigits: 0,
						}).format(data.forecastedCommission.before)
					: 'R$ 0'
			}
		/>
	);
}

export { CardKpiForecastedCommission };
