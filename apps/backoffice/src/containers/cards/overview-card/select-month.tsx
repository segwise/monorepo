'use client';

import { useState } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

function SelectMonth() {
	const [month, setMonth] = useState('month');

	return (
		<Select value={month.toString()} onValueChange={setMonth}>
			<SelectTrigger>
				<SelectValue placeholder='Mês' className='capitalize' />
			</SelectTrigger>
			<SelectContent align='end'>
				{Array.from({ length: 12 }).map((_, index) => {
					const code = new Intl.DateTimeFormat('en-US', {
						month: 'long',
					})
						.format(new Date().setMonth(index))
						.toLowerCase();
					const name = new Intl.DateTimeFormat('pt-BR', {
						month: 'long',
					})
						.format(new Date().setMonth(index))
						.replace(/^./, (c) => c.toUpperCase());

					return (
						<SelectItem key={index.toString()} value={code}>
							{name}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}

export { SelectMonth };
