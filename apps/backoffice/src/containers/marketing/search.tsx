'use client';

import { SearchIcon, XCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/libraries/utils';

// Mesmo comportamento do `InputSearch` (propostas, produtores...): digitar não
// filtra, só Enter ou o botão de lupa aplicam a busca. `value` é o termo já
// aplicado (query param) e `onChange` só dispara ao confirmar ou limpar.
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
	const [search, setSearch] = useState<string>(value);

	function onSubmit() {
		onChange(search.trim() || null);
	}

	useEffect(() => {
		setSearch(value);
	}, [value]);

	return (
		<InputGroup className={cn('w-60', className)}>
			<InputGroupInput
				value={search}
				placeholder={placeholder}
				onKeyDown={({ key }) => {
					if (key.toLowerCase() === 'enter') {
						onSubmit();
					}
				}}
				onChange={({ target }) => setSearch(target.value)}
			/>
			{!!value && (
				<XCircleIcon
					className='text-destructive size-3.5 mr-3 z-10 cursor-pointer'
					onClick={() => {
						onChange(null);
						setSearch('');
					}}
				/>
			)}
			<InputGroupAddon align='inline-end'>
				<InputGroupButton
					variant='default'
					size='icon-sm'
					className='size-10 -mr-2 rounded-l-none text-white'
					onClick={onSubmit}
				>
					<SearchIcon />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}

export { MarketingSearch };
