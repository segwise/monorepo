'use client';

import { SchemaName } from '@segwise/core/schemas';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from '@/libraries/search-params/quotes';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from './ui/input-group';

function InputSearch() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [search, setSearch] = useState<string>(searchParams.search || '');

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
		});
	}

	return (
		<InputGroup className='w-60'>
			<InputGroupInput
				value={capitalizeFirstLetters(search)}
				placeholder='Pesquisar...'
				onKeyDown={(props) => {
					if (props.key.toLowerCase() === 'enter') {
						onSubmit();
					}
				}}
				onChange={({ target: { value } }) => setSearch(value || '')}
			/>
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
