'use client';

import { CardDescription as Description } from '@/components/ui/card';
import { formatDateRange, usePeriodFilter } from '../dashboard/period-filter';

async function CardDescription() {
	const { resolved } = usePeriodFilter();

	return (
		<Description className='flex flex-col gap-y-0.5'>
			<span>Resumo operacional de hoje.</span>
			<span className='text-xs text-muted-foreground/70'>
				{formatDateRange(resolved.current)}{' '}
				<span className='text-muted-foreground/50'>vs.</span>{' '}
				{formatDateRange(resolved.reference)}
			</span>
		</Description>
	);
}

export { CardDescription };
