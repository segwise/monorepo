'use client';

import { FileSearchIcon } from 'lucide-react';
import { usePeriodFilter } from '@/containers/cards/dashboard/period-filter';
import { useInsuranceMetric } from '@/hooks/analytics/use-insurance-metrics';
import { CardHeaderHome } from '../header-home';

function CardKpiQuotesCount() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useInsuranceMetric('quotes-count', resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={FileSearchIcon}
			title='Cotações Geradas'
			value={
				data
					? new Intl.NumberFormat('pt-BR').format(data.comparison.current)
					: '0'
			}
			percent={data?.comparison.percent ?? 0}
			before={
				data
					? new Intl.NumberFormat('pt-BR').format(data.comparison.reference)
					: '0'
			}
		/>
	);
}

export { CardKpiQuotesCount };
