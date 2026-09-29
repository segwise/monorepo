'use client';

import { SearchIcon, XCircleIcon } from 'lucide-react';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/libraries/utils';

function MarketingSearch({
	value,
	onChange,
	placeholder = 'Pesquisar...',
	className,
}: {
	value: string;
	onChange: (value: string | null) => void;
	placeholder?: string;
	className?: string;
}) {
	return (
		<InputGroup className={cn('w-72', className)}>
			<InputGroupAddon align='inline-start'>
				<SearchIcon className='size-4' />
			</InputGroupAddon>
			<InputGroupInput
				value={value}
				placeholder={placeholder}
				onChange={({ target }) => onChange(target.value || null)}
			/>
			{!!value && (
				<XCircleIcon
					className='text-destructive size-3.5 mr-3 z-10 cursor-pointer'
					onClick={() => onChange(null)}
				/>
			)}
		</InputGroup>
	);
}

export { MarketingSearch };
