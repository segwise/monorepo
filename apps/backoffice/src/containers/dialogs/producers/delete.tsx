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
import { useProducersDeleteById } from '@/libraries/hooks/producers/use-producers-delete';

function DialogProducerDelete({
	id,
	kind,
	open,
	onOpenChange,
}: {
	id: string;
	kind: 'producer' | 'partner';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate, isPending } = useProducersDeleteById(id);
	const label = kind === 'partner' ? 'Parceiro' : 'Produtor';

	function onSubmit() {
		mutate(undefined, {
			onSuccess(data) {
				toast.success(
					data.action === 'suspended'
						? `${label.toUpperCase()} SUSPENSO, POIS POSSUI REGISTROS VINCULADOS!`
						: `${label.toUpperCase()} EXCLUÍDO COM SUCESSO!`,
				);

				onOpenChange(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao excluir registro');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Excluir {label}</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
				</DialogHeader>
				<Separator />
				<span className='text-sm font-medium'>
					Se não houver cotações ou propostas vinculadas, o cadastro será
					excluído definitivamente. Caso exista algum vínculo, ele será apenas
					suspenso para preservar o histórico.
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

export { DialogProducerDelete };
