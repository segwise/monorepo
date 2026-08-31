'use client';

import { TicketIcon } from 'lucide-react';
import { useOperationalKpis } from '@/hooks/analytics/use-operational-kpis';
import { CardHeaderHome } from '../header-home';
import { usePeriodFilter } from './period-filter';

function CardKpiAverageTicket() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useOperationalKpis(resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={TicketIcon}
			title='Média de Fechamentos'
			value={
				data
					? new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
							maximumFractionDigits: 0,
						}).format(data.averageTicket.current)
					: 'R$ 0'
			}
			percent={data?.averageTicket.percent ?? 0}
			before={
				data
					? new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
							maximumFractionDigits: 0,
						}).format(data.averageTicket.before)
					: 'R$ 0'
			}
		/>
	);
}

export { CardKpiAverageTicket };
