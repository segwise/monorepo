'use client';

import { SaveIcon, XCircleIcon } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useProducersPendingDeleteById } from '@/libraries/hooks/producers/use-producers-pending-delete';

function DialogProducerPendingDelete({
	id,
	open,
	onOpenChange,
}: {
	id: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate, isPending } = useProducersPendingDeleteById(id);

	function onSubmit() {
		mutate(undefined, {
			onSuccess() {
				toast.success('CONVITE EXCLUÍDO COM SUCESSO!');

				onOpenChange(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao excluir convite');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Excluir Convite</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
				</DialogHeader>
				<Separator />
				<span className='text-sm font-medium'>
					Ao realizar esta ação, o convite deixa de existir e o link enviado
					para o e-mail não vai mais funcionar. A ação não pode ser revertida.
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

export { DialogProducerPendingDelete };
