'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { cn } from '@/libraries/utils';

function FilterBasisOfAnalysis({ className }: { className?: string }) {
	const [searchParams, setSearchParams] = useSearchParams();

	function onChange() {
		setSearchParams({
			basisOfAnalysis:
				searchParams.basisOfAnalysis === 'year' ? 'month' : 'year',
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
			{/** biome-ignore lint/a11y/noStaticElementInteractions: div */}
			{/** biome-ignore lint/a11y/useKeyWithClickEvents: div */}
			<div
				onClick={onChange}
				className='flex flex-row items-center justify-start gap-x-0.5 text-active cursor-pointer underline'
			>
				<span className='font-medium ml-0.5'>
					{searchParams.basisOfAnalysis === 'year' ? 'ANO' : 'MÊS'} ANTERIOR
				</span>
				<ChevronsUpDownIcon className='size-3 stroke-3' />
			</div>
		</span>
	);
}

export { FilterBasisOfAnalysis };
