import { FilePlusIcon, XCircleIcon } from 'lucide-react';
import type React from 'react';
import { cloneElement, useState } from 'react';
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

interface DialogSafeEndorsementByIdProps {
	id: string;
}

function DialogSafeEndorsementById({
	id,
	children,
}: React.PropsWithChildren<DialogSafeEndorsementByIdProps>) {
	const [open, setOpen] = useState<boolean>(false);

	// @ts-expect-error
	const Comp = cloneElement(children, {
		onSelect: (e) => e.preventDefault(),
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{Comp}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Endossos do Seguro</DialogTitle>
					<DialogDescription>
						Aqui estão os endossos gerados da apólice
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<div className='bg-muted px-4 py-6 rounded-md border border-border/50 text-sm text-muted-foreground font-normal'>
					Não há endosso para a apólice vigente
				</div>
				<Separator />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='destructive' tabIndex={-1}>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button>
						Novo Endosso <FilePlusIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogSafeEndorsementById };
