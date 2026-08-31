'use client';

import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
} from '@/components/ui/card';
import {
	formatDateRange,
	usePeriodFilter,
} from '@/containers/cards/dashboard/period-filter';
import { ComparisonToggle } from './comparison-toggle';
import { SelectPeriod } from './select-period';
import { CardTitle } from './title';

function CardOverview() {
	const { resolved } = usePeriodFilter();

	return (
		<Card>
			<CardHeader className='max-sm:grid-cols-1! gap-y-3'>
				<CardTitle />
				<CardDescription className='flex flex-col gap-y-0.5'>
					<span>Resumo operacional de hoje.</span>
					<span className='text-xs text-muted-foreground/70'>
						{formatDateRange(resolved.current)}{' '}
						<span className='text-muted-foreground/50'>vs.</span>{' '}
						{formatDateRange(resolved.reference)}
						{resolved.comparisonMode === 'yoy'
							? ' (ano anterior)'
							: ' (período anterior)'}
					</span>
				</CardDescription>
				<CardAction className='flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-2 max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:w-full'>
					<Button variant='outline' className='max-sm:w-full!'>
						<FilterIcon /> Filtrar
					</Button>
					<ComparisonToggle />
					<SelectPeriod />
				</CardAction>
			</CardHeader>
		</Card>
	);
}

export { CardOverview };
