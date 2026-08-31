'use client';

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

			<button
				type='button'
				role='switch'
				aria-checked={isPreviousPeriod}
				aria-label='Comparar com período anterior em vez de ano anterior'
				onClick={() =>
					setComparisonMode(isPreviousPeriod ? 'yoy' : 'previous-period')
				}
				className={cn(
					'relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors',
					isPreviousPeriod ? 'bg-active' : 'bg-muted',
				)}
			>
				<span
					aria-hidden
					className={cn(
						'inline-block size-4.5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out',
						isPreviousPeriod
							? 'translate-x-[calc(100%+2px)]'
							: 'translate-x-0.5',
					)}
				/>
			</button>

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
