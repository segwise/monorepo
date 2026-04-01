'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { cn } from '@/libraries/utils';

function FilterBasisOfAnalysis({ className }: { className?: string }) {
	const [{ basisOfAnalysis }, setSearchParams] = useSearchParams();

	function onChange() {
		setSearchParams({
			basisOfAnalysis:
				!basisOfAnalysis || basisOfAnalysis === 'year' ? 'month' : 'year',
		});
	}

	return (
		<span
			className={cn(
				'text-xs text-muted-foreground font-normal -mt-2 mb-2 flex flex-row items-center justify-start gap-x-0.5',
				className,
			)}
		>
			Avaliação referente ao{' '}
			<Button
				variant='link'
				onClick={onChange}
				className='flex flex-row items-center justify-start gap-x-0.5 text-active cursor-pointer underline p-0! text-xs h-fit!'
			>
				<span className='font-medium ml-0.5'>
					{!basisOfAnalysis || basisOfAnalysis === 'year'
						? 'ANO'
						: basisOfAnalysis === 'month'
							? 'MÊS'
							: 'NULL'}{' '}
					ANTERIOR
				</span>
				<ChevronsUpDownIcon className='size-3! stroke-3!' />
			</Button>
		</span>
	);
}

export { FilterBasisOfAnalysis };
