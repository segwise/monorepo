'use client';

import {
	getProducerSecondPaymentDays,
	SchemaProducerStartOfProductionPayment,
} from '@segwise/core/schemas';
import { useEffect } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const FIRST_DAYS: number[] = SchemaProducerStartOfProductionPayment.values
	.values()
	.toArray();

function ProducerPaymentDays({
	id,
	typeOfPayment,
	value,
	onChange,
	invalid,
}: {
	id: string;
	typeOfPayment?: string;
	value?: number[];
	onChange: (value: number[]) => void;
	invalid?: boolean;
}) {
	const count = typeOfPayment === 'bi_weekly' ? 2 : 1;
	const days = value || [];

	function options(index: number): number[] {
		return index === 0
			? FIRST_DAYS
			: (getProducerSecondPaymentDays(days[0]) as number[]);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: só reage à troca de tipo
	useEffect(() => {
		if (days.length > count) {
			onChange(days.slice(0, count));
		}
	}, [count]);

	return (
		<div className='grid grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]'>
			{Array.from({ length: count }, (_, index) => (
				<Select
					key={index.toString()}
					value={days[index] ? String(days[index]) : ''}
					onValueChange={(next) => {
						const updated = [...days];
						updated[index] = Number(next);

						if (
							index === 0 &&
							updated[1] &&
							!(getProducerSecondPaymentDays(updated[0]) as number[]).includes(
								updated[1],
							)
						) {
							updated.length = 1;
						}

						onChange(updated.slice(0, count));
					}}
				>
					<SelectTrigger
						id={index === 0 ? id : `${id}-${index}`}
						aria-invalid={invalid}
					>
						<SelectValue
							placeholder={count === 2 ? `${index + 1}º dia` : 'Selecionar'}
						/>
					</SelectTrigger>
					<SelectContent>
						{options(index).map((item) => (
							<SelectItem key={item} value={String(item)}>
								Dia {item}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			))}
		</div>
	);
}

export { ProducerPaymentDays };
