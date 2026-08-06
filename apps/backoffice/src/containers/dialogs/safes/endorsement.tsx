import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
import { withMask } from 'use-mask-input';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
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
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useEndorsements } from '@/libraries/hooks/use-endorsement';

interface DialogSafeEndorsementByIdProps {
	id: string;
}

function DialogSafeEndorsementById({
	id,
	children,
}: React.PropsWithChildren<DialogSafeEndorsementByIdProps>) {
	const [open, setOpen] = useState<boolean>(false);

	const { data, isPending } = useEndorsements(id, open);

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
				<div className='space-y-3'>
					{isPending &&
						Array.from({ length: 3 }).map((_, index) => (
							<Skeleton key={index.toString()} className='w-full h-18' />
						))}
					{!isPending && !data?.length && (
						<div className='bg-muted px-4 py-6 rounded-md border border-border text-sm text-muted-foreground font-normal'>
							Não há endosso para a apólice vigente
						</div>
					)}
					{!isPending &&
						data?.map(({ id, type, effectivedAt }) => (
							<div
								key={id}
								className='border border-border bg-muted rounded-lg px-2 py-4'
							>
								Tipo: {type}
								Data de efetivação:{' '}
								{format(toZonedTime(effectivedAt, 'UTC'), 'dd/MM/yyyy')}
							</div>
						))}
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
		'vehicle_conductor' | 'address' | 'franchise' | 'cancellation' | null
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
				<div className='space-y-2'>
					<Field className='col-span-full'>
						<FieldLabel htmlFor='message'>Tipo de endosso:</FieldLabel>
						<Select
							value={type as keyof typeof type}
							// @ts-expect-error
							onValueChange={(value: typeof type) => {
								const props: typeof type = value;

								setType(props);

								if (props === 'vehicle_conductor') {
								}

								if (props === 'address') {
								}

								if (props === 'franchise') {
								}

								if (props === 'cancellation') {
								}
							}}
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
					{type === 'vehicle_conductor' && (
						<form noValidate className='space-y-2 mt-4'>
							<FieldGroup className='grid grid-cols-2 gap-2'>
								<Field>
									<div className='flex flex-row items-center justify-between'>
										<FieldLabel>Placa:</FieldLabel>
										<FieldLabel
											htmlFor='not-plate'
											className='flex flex-row items-center justify-end gap-x-1 text-xs'
										>
											Sem placa? <Switch id='not-plate' size='sm' />
										</FieldLabel>
									</div>
									<Input placeholder='AAA-0000 ou AAA0A00' />
								</Field>
								<Field>
									<FieldLabel>Frânquia:</FieldLabel>
									<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
								</Field>
								<Field className='col-span-full'>
									<FieldLabel>CPF do Condutor:</FieldLabel>
									<Input placeholder='000.000.000-00' />
									<FieldDescription className='text-foreground text-xs -mt-2'>
										Nome do condutor
									</FieldDescription>
								</Field>
							</FieldGroup>
							<Separator className='opacity-100 my-4' />
							<FieldGroup className='grid grid-cols-3 gap-2'>
								<Field>
									<FieldLabel>Valor:</FieldLabel>
									<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
								</Field>
								<Field>
									<FieldLabel>Percentual:</FieldLabel>
									<Input
										ref={withMask('percentage')}
										placeholder='0%'
										min={0}
										max={100}
									/>
								</Field>
								<Field>
									<FieldLabel>Comissão:</FieldLabel>
									<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
								</Field>
							</FieldGroup>
						</form>
					)}
					{type === 'address' && (
						<form noValidate className='space-y-2 mt-4'>
							<Field>
								<FieldLabel>CEP:</FieldLabel>
								<Input placeholder='00000-000' />
							</Field>
							<Separator className='opacity-100 my-4' />
							<FieldGroup className='grid grid-cols-3 gap-2'>
								<Field>
									<FieldLabel>Valor:</FieldLabel>
									<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
								</Field>
								<Field>
									<FieldLabel>Percentual:</FieldLabel>
									<Input
										ref={withMask('percentage')}
										placeholder='0%'
										min={0}
										max={100}
									/>
								</Field>
								<Field>
									<FieldLabel>Comissão:</FieldLabel>
									<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
								</Field>
							</FieldGroup>
						</form>
					)}
					{type === 'franchise' && (
						<form noValidate className='space-y-2 mt-4'>
							<Field>
								<FieldLabel>Frânquia:</FieldLabel>
								<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
							</Field>
							<Separator className='opacity-100 my-4' />
							<FieldGroup className='grid grid-cols-3 gap-2'>
								<Field>
									<FieldLabel>Valor:</FieldLabel>
									<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
								</Field>
								<Field>
									<FieldLabel>Percentual:</FieldLabel>
									<Input
										ref={withMask('percentage')}
										placeholder='0%'
										min={0}
										max={100}
									/>
								</Field>
								<Field>
									<FieldLabel>Comissão:</FieldLabel>
									<Input ref={withMask('brl-currency')} placeholder='R$ 0,00' />
								</Field>
							</FieldGroup>
						</form>
					)}
					{type === 'cancellation' && (
						<form noValidate className='mt-4'>
							<Field>
								<FieldLabel>Data de cancelamento:</FieldLabel>
								<DatePickerInput />
							</Field>
						</form>
					)}
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
