'use client';

import { CalendarIcon } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	type PeriodPreset,
	usePeriodFilter,
} from '@/containers/cards/dashboard/period-filter';

const PRESET_LABEL: Record<PeriodPreset, string> = {
	'7d': 'Últimos 7 dias',
	'30d': 'Últimos 30 dias',
	month: 'Este mês',
	quarter: 'Este trimestre',
	year: 'Este ano',
};

function SelectPeriod() {
	const { preset, setPreset } = usePeriodFilter();

	return (
		<Select
			value={preset}
			onValueChange={(value) => setPreset(value as PeriodPreset)}
		>
			<SelectTrigger className='w-full sm:w-44'>
				<CalendarIcon className='size-4' />
				<SelectValue>{PRESET_LABEL[preset]}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='7d'>Últimos 7 dias</SelectItem>
				<SelectItem value='30d'>Últimos 30 dias</SelectItem>
				<SelectItem value='month'>Este mês</SelectItem>
				<SelectItem value='quarter'>Este trimestre</SelectItem>
				<SelectItem value='year'>Este ano</SelectItem>
			</SelectContent>
		</Select>
	);
}

export { SelectPeriod };
