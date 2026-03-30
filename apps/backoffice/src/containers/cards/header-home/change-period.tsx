'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChangePeriodProps {
	value: string;
	type: 'year' | 'month';
	setType: (type: 'year' | 'month') => void;
}

function ChangePeriod({ value, type, setType }: ChangePeriodProps) {
	return (
		<Button
			variant='ghost'
			className='text-xs font-medium text-muted-foreground/80 flex flex-row items-center justify-start gap-x-1 cursor-pointer w-fit p-0 h-fit'
			onClick={() => setType(type === 'year' ? 'month' : 'year')}
		>
			Do <span className='underline'>{type === 'year' ? 'ano' : 'mês'}</span>{' '}
			anterior: {value}
			<ChevronsUpDownIcon className='size-3.5!' />
		</Button>
	);
}

export { ChangePeriod };
