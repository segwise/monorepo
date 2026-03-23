import { SaveIcon, XCircleIcon } from 'lucide-react';
import type React from 'react';
import { cloneElement } from 'react';
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

function DialogQuoteDeleteById({
	children,
}: React.PropsWithChildren<{
	id: string;
}>) {
	// @ts-expect-error
	const Comp = cloneElement(children, {
		onSelect: (e) => e.preventDefault(),
	});

	return (
		<Dialog>
			<DialogTrigger asChild>{Comp}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Excluir Registro de Cotação</DialogTitle>
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
						<Button variant='destructive'>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button>
						Confirmar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogQuoteDeleteById };
