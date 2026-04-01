import { SaveIcon, XCircleIcon } from 'lucide-react';
import type React from 'react';
import { cloneElement, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useSafesDeleteById } from '@/libraries/hooks/safes/use-safes-delete';

function DialogSafeDeleteById({
	children,
	id,
}: React.PropsWithChildren<{
	id: string;
}>) {
	const [open, setOpen] = useState<boolean>(false);

	// @ts-expect-error
	const Comp = cloneElement(children, {
		onSelect: (e) => e.preventDefault(),
	});

	const { mutate, isPending } = useSafesDeleteById(id);

	function onSubmit() {
		mutate(undefined, {
			async onSuccess() {
				toast.success('REGISTRO DELETADO COM SUCESSO!', {
					description: 'O registro não poderá mais ser recuperado',
				});

				setOpen(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao excluir registro');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{Comp}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Excluir Registro de Seguro</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
				</DialogHeader>
				<Separator />
				<span className='text-sm font-medium'>
					Ao realiza esta ação. A mesma não poderá ser revertida, e o registro
					será perdido.
				</span>
				<Separator />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='destructive' tabIndex={-1}>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button
						isPending={isPending}
						textPending='Confirmando'
						onClick={onSubmit}
					>
						Confirmar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogSafeDeleteById };
