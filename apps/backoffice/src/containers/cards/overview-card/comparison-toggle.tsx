'use client';

import { Switch } from '@/components/ui/switch';
import { usePeriodFilter } from '@/containers/cards/dashboard/period-filter';
import { cn } from '@/libraries/utils';

function ComparisonToggle() {
	const { comparisonMode, setComparisonMode, isComparisonModeSelectable } =
		usePeriodFilter();

	if (!isComparisonModeSelectable) {
		return null;
	}

	const isPreviousPeriod = comparisonMode === 'previous-period';

	return (
		<div className='flex flex-row items-center gap-x-2'>
			<span
				className={cn(
					'text-sm font-medium transition-colors whitespace-nowrap',
					!isPreviousPeriod ? 'text-foreground' : 'text-muted-foreground',
				)}
			>
				Ano anterior
			</span>
			<Switch
				checked={isPreviousPeriod}
				onCheckedChange={() =>
					setComparisonMode(isPreviousPeriod ? 'yoy' : 'previous-period')
				}
			/>
			<span
				className={cn(
					'text-sm font-medium transition-colors whitespace-nowrap',
					isPreviousPeriod ? 'text-foreground' : 'text-muted-foreground',
				)}
			>
				Período anterior
			</span>
		</div>
	);
}

export { ComparisonToggle };
