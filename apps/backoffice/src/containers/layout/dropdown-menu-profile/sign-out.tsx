'use client';

import { LogOutIcon } from 'lucide-react';
import { Fragment } from 'react';
import { toast } from 'sonner';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useSignOut } from '@/hooks/auth/use-sign-out';

function DropdownmenuButtonSignOut() {
	const { mutate, isPending } = useSignOut();

	function handler() {
		toast.dismiss();

		mutate(undefined, {
			onSuccess(_data, _variables, _result, ctx) {
				ctx.client.clear();

				window.location.reload();
			},
			onError(error) {
				toast.error(error.message);
			},
		});
	}

	return (
		<DropdownMenuItem variant='destructive' onClick={handler}>
			{!isPending && (
				<Fragment>
					<LogOutIcon />
					<span>Deslogar</span>
				</Fragment>
			)}
			{isPending && (
				<Fragment>
					<Spinner />
					<span>Deslogando</span>
				</Fragment>
			)}
		</DropdownMenuItem>
	);
}

export { DropdownmenuButtonSignOut };
