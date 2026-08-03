'use client';

import { useSearchParams } from '@/libraries/search-params/quotes';

interface ChangePeriodProps {
	value: string;
}

function ChangePeriod({ value }: ChangePeriodProps) {
	const [searchParams] = useSearchParams();

	return (
		<div className='text-xs font-medium text-muted-foreground/80 flex flex-row items-center justify-start gap-x-1 w-fit p-0 h-fit'>
			Do{' '}
			{!searchParams.basisOfAnalysis || searchParams.basisOfAnalysis === 'year'
				? 'ano'
				: 'mês'}{' '}
			anterior: {value.padStart(2, '0')}
		</div>
	);
}

function ChangePeriodList({ value }: ChangePeriodProps) {
	const [searchParams] = useSearchParams();

	return (
		<div className='text-xs font-medium text-muted-foreground/80 flex flex-row items-center justify-start gap-x-1 w-fit p-0 h-fit'>
			Do{' '}
			{!searchParams.basisOfAnalysis || searchParams.basisOfAnalysis === 'year'
				? 'ano'
				: 'mês'}{' '}
			anterior: {value.padStart(2, '0')}
		</div>
	);
}

export { ChangePeriod, ChangePeriodList };
