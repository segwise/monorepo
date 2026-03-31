'use client';

import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format, setMonth, startOfToday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useQueryState } from 'nuqs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

function SelectMonth() {
	const [params, setParams] = useQueryState('month', {
		clearOnDefault: false,
		defaultValue: format(startOfToday(), 'LLLL', {
			locale: enUS,
		}).toLowerCase(),
	});

	return (
		<Select value={params.toString()} onValueChange={setParams}>
			<SelectTrigger className='max-sm:w-full!'>
				<SelectValue placeholder='Mês' className='capitalize' />
			</SelectTrigger>
			<SelectContent align='end'>
				{Array.from({ length: 12 }).map((_, index) => {
					const month = setMonth(startOfToday(), index);

					const code = format(month, 'LLLL', {
						locale: enUS,
					}).toLowerCase();

					return (
						<SelectItem key={index.toString()} value={code}>
							{capitalizeFirstLetters(format(month, 'LLLL'))}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}

export { SelectMonth };
