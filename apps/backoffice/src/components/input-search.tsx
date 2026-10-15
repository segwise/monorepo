'use client';

import {
	isCNPJ,
	isCPF,
	isPhone,
	isPlate,
	maskCNPJ,
	maskCPF,
	maskPhone,
	maskPlate,
} from '@segwise/core';
import { SchemaName } from '@segwise/core/schemas';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { SearchIcon, XCircleIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { cn } from '@/libraries/utils';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from './ui/input-group';

function InputSearch({ className }: { className?: string }) {
	const routerName = usePathname();

	const [searchParams, setSearchParams] = useSearchParams();

	const [search, setSearch] = useState<string>(searchParams.search ?? '');

	const isValid = search === '' ? true : SchemaName.safeParse(search).success;

	function onSubmit() {
		if (!isValid) {
			return;
		}

		setSearchParams({
			...(!!search && {
				search,
			}),
			...(!search && {
				search: null,
			}),
			cursor: null,
			requestedAt: null,
			// @ts-expect-error
			effectivedAt: null,
		});
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: useEffect
	useEffect(() => {
		setSearch(searchParams.search || '');
	}, [routerName, searchParams.search]);

	return (
		<InputGroup className={cn('w-60', className)}>
			<InputGroupInput
				value={capitalizeFirstLetters(search)}
				placeholder='Pesquisar...'
				onKeyDown={(props) => {
					if (props.key.toLowerCase() === 'enter') {
						onSubmit();
					}
				}}
				onChange={({ target: { value } }) =>
					setSearch(
						isCNPJ(value)
							? maskCNPJ(value)
							: isCPF(value)
								? maskCPF(value)
								: isPhone(value)
									? maskPhone(value)
									: isPlate(value)
										? maskPlate(value)
										: value || '',
					)
				}
			/>
			{!!searchParams.search && (
				<XCircleIcon
					className='text-destructive size-3.5 mr-3 z-10 cursor-pointer'
					onClick={() => [
						setSearchParams({
							search: null,
							cursor: null,
							requestedAt: null,
						}),
						setSearch(''),
					]}
				/>
			)}
			<InputGroupAddon align='inline-end'>
				<InputGroupButton
					disabled={!isValid}
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

export { InputSearch };
