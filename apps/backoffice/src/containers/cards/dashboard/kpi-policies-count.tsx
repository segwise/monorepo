'use client';

import { FileTextIcon } from 'lucide-react';
import { usePeriodFilter } from '@/containers/cards/dashboard/period-filter';
import { useInsuranceMetric } from '@/hooks/analytics/use-insurance-metrics';
import { CardHeaderHome } from '../header-home';

function CardKpiPoliciesCount() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useInsuranceMetric('policies-count', resolved);

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={FileTextIcon}
			title='Apólices Emitidas'
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

export { CardKpiPoliciesCount };
