'use client';

import { LogOutIcon } from 'lucide-react';
import { useSignOut } from '@/libraries/hooks/auth/sign-out';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

function ButtonSignOut() {
	const { mutate, isPending } = useSignOut();

	async function handler() {
		mutate();
	}

	return (
		<Button
			className='w-full h-8! justify-start bg-destructive/5! text-destructive! hover:bg-destructive/10! active:bg-destructive/10!'
			disabled={isPending}
			onClick={handler}
			variant='ghost'
		>
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
		</Button>
	);
}

export { ButtonSignOut };
