'use client';

import { TimerIcon } from 'lucide-react';
import { useOperationalKpis } from '@/hooks/analytics/use-operational-kpis';
import { CardHeaderHome } from '../header-home';
import { usePeriodFilter } from './period-filter';

function CardKpiClosingTime() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useOperationalKpis(resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={TimerIcon}
			title='Tempo de Fechamento'
			value={
				data
					? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(data.averageClosingTimeDays.current)} dias`
					: '0 dias'
			}
			// tempo menor é melhor: inverte o sinal pra manter a semântica visual (verde = melhora)
			percent={data ? -data.averageClosingTimeDays.percent : 0}
			before={
				data
					? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(data.averageClosingTimeDays.before)} dias`
					: '0 dias'
			}
		/>
	);
}

export { CardKpiClosingTime };
