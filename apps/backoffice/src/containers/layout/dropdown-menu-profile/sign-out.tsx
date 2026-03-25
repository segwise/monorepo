'use client';

import { LogOutIcon } from 'lucide-react';
import { Activity } from 'react';
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
			<Activity mode={!isPending ? 'visible' : 'visible'}>
				<LogOutIcon />
				<span>Deslogar</span>
			</Activity>
			<Activity mode={isPending ? 'visible' : 'hidden'}>
				<Spinner />
				<span>Deslogando</span>
			</Activity>
		</DropdownMenuItem>
	);
}

export { DropdownmenuButtonSignOut };
