import {
	CarIcon,
	DollarSignIcon,
	FilePlusIcon,
	MapPinIcon,
	SaveIcon,
	XCircleIcon,
} from 'lucide-react';
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
import { Field, FieldLabel } from '@/components/ui/field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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
					<DialogSafeEndorsementDetails id={id}>
						<Button>
							Novo Endosso <FilePlusIcon />
						</Button>
					</DialogSafeEndorsementDetails>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DialogSafeEndorsementDetails({
	id,
	children,
}: React.PropsWithChildren<DialogSafeEndorsementByIdProps>) {
	const [open, setOpen] = useState<boolean>(false);

	const [type, setType] = useState<
		'vehicle-conductor' | 'address' | 'franchise' | 'cancellation' | null
	>(null);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent removeOverlay>
				<DialogHeader>
					<DialogTitle>Novo Endosso</DialogTitle>
					<DialogDescription>
						Adicione um novo registro de endosso para a apólice
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<div>
					<Field className='col-span-full'>
						<FieldLabel htmlFor='message'>Tipo de endosso:</FieldLabel>
						<Select
							value={type as keyof typeof type}
							onValueChange={(value: keyof typeof type) => setType(value)}
						>
							<SelectTrigger>
								<SelectValue>
									{type ? undefined : 'Selecionar tipo'}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='vehicle-conductor'>
									<div className='flex flex-row items-center justify-start gap-x-2'>
										<CarIcon /> Veicular | Condutor
									</div>
								</SelectItem>
								<SelectItem value='address'>
									<div className='flex flex-row items-center justify-start gap-x-2'>
										<MapPinIcon /> Endereço
									</div>
								</SelectItem>
								<SelectItem value='franchise'>
									<div className='flex flex-row items-center justify-start gap-x-2'>
										<DollarSignIcon /> Frânquia
									</div>
								</SelectItem>
								<SelectItem value='cancellation'>
									<div className='flex flex-row items-center justify-start gap-x-2'>
										<XCircleIcon /> Cancelamento
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</Field>
					{/* <form noValidate /> */}
				</div>
				<Separator />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='destructive' tabIndex={-1}>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button>
						Cadastrar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogSafeEndorsementById };
