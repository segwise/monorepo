'use client';

import { LogOutIcon } from 'lucide-react';
import { useSignOut } from '@/libraries/hooks/auth/sign-out';
import { DropdownMenuItem } from '../../../components/ui/dropdown-menu';
import { Spinner } from '../../../components/ui/spinner';

function DropdownmenuButtonSignOut() {
	const { mutate, isPending } = useSignOut();

	function handler() {
		mutate();
	}

	return (
		<DropdownMenuItem variant='destructive' onClick={handler}>
			{!isPending && (
				<>
					<LogOutIcon />
					<span>Deslogar</span>
				</>
			)}
			{isPending && (
				<>
					<Spinner />
					<span>Deslogando</span>
				</>
			)}
		</DropdownMenuItem>
	);
}

export { DropdownmenuButtonSignOut };
