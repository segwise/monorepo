'use client';

import { PercentIcon } from 'lucide-react';
import { useOperationalKpis } from '@/hooks/analytics/use-operational-kpis';
import { CardHeaderHome } from '../header-home';
import { usePeriodFilter } from './period-filter';

function CardKpiConversionRate() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useOperationalKpis(resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={PercentIcon}
			title='Taxa de Conversão'
			value={
				data
					? new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
							data.conversionRate.current,
						)
					: '0%'
			}
			percent={data?.conversionRate.percent ?? 0}
			before={
				data
					? new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
							data.conversionRate.before,
						)
					: '0%'
			}
		/>
	);
}

export { CardKpiConversionRate };
