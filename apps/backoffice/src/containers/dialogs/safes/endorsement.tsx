import { zodResolver } from '@hookform/resolvers/zod';
import {
	type EndorsementAddress,
	type EndorsementCancel,
	type EndorsementFranchise,
	getNumericValue,
	maskPostalCode,
	SchemaEndorsementAddress,
	SchemaEndorsementCancel,
	SchemaEndorsementFranchise,
} from '@segwise/core';
import { format, startOfToday } from 'date-fns';
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
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
	FieldError,
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
import {
	useEndorsementAddress,
	useEndorsementCancel,
	useEndorsementFranchise,
	useEndorsements,
} from '@/libraries/hooks/use-endorsement';

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
						data?.map(({ id, type, effectivedAt, createdAt }) => (
							<div
								key={id}
								className='border border-border bg-muted rounded-md p-4'
							>
								<div className='text-sm'>
									<b>
										Endosso de{' '}
										{type === 'cancellation'
											? 'Cancelamento'
											: type === 'address'
												? 'Endereço'
												: type === 'franchise'
													? 'Frânquia'
													: 'Veicular | Condutor'}
									</b>
								</div>
								<div className='text-sm'>
									<b>Data:</b>{' '}
									{format(
										toZonedTime(effectivedAt ?? createdAt, 'UTC'),
										'dd/MM/yyyy',
									)}
								</div>
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

	const { mutate: address, isPending: isPendingAddress } =
		useEndorsementAddress();
	const { mutate: franchise, isPending: isPendingFranchise } =
		useEndorsementFranchise();
	const { mutate: cancel, isPending: isCanceling } = useEndorsementCancel();

	const formAddress = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaEndorsementAddress),
		defaultValues: {
			postalCode: '',
			amount: 0,
			percentage: 0,
		},
	});

	const formFranchise = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaEndorsementFranchise),
		defaultValues: {
			franchise: 0,
			amount: 0,
			percentage: 0,
		},
	});

	const formCancel = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaEndorsementCancel),
		defaultValues: {
			effectivedAt: startOfToday(),
		},
	});

	function onSubmitAddress(props: EndorsementAddress) {
		toast.dismiss();

		address(
			{
				id,
				...props,
			},
			{
				onSuccess(_, __, ___) {
					toast.success('Endosso registrado!'.toUpperCase());

					setOpen(false);
				},
				onError(error) {
					toast.error(
						(error.message ?? 'Falha ao registrar endosso').toUpperCase(),
					);
				},
			},
		);
	}

	function onSubmitFranchise(props: EndorsementFranchise) {
		toast.dismiss();

		franchise(
			{
				id,
				...props,
			},
			{
				onSuccess(_, __, ___) {
					toast.success('Endosso registrado!'.toUpperCase());

					setOpen(false);
				},
				onError(error) {
					toast.error(
						(error.message ?? 'Falha ao registrar endosso').toUpperCase(),
					);
				},
			},
		);
	}

	function onSubmitCancel(props: EndorsementCancel) {
		toast.dismiss();

		cancel(
			{
				id,
				...props,
			},
			{
				onSuccess(_, __, ___) {
					toast.success('Endosso registrado!'.toUpperCase());

					setOpen(false);
				},
				onError(error) {
					toast.error(
						(error.message ?? 'Falha ao registrar endosso').toUpperCase(),
					);
				},
			},
		);
	}

	function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
		if (e.key !== 'Enter') {
			return;
		}

		const target = e.target as HTMLElement;

		if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
			return;
		}

		const form = e.currentTarget;

		const focusable = Array.from(
			form.querySelectorAll<HTMLElement>(
				'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
			),
		).filter((el) => {
			return el.offsetParent !== null;
		});

		const currentIndex = focusable.indexOf(target);

		const isLastField = currentIndex === focusable.length - 1;

		if (isLastField) {
			return;
		}

		e.preventDefault();

		if (currentIndex !== -1 && currentIndex < focusable.length - 1) {
			focusable[currentIndex + 1]?.focus();
		}
	}

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
							onValueChange={setType}
						>
							<SelectTrigger>
								<SelectValue>
									{type ? undefined : 'Selecionar tipo'}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='vehicle_conductor'>
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
						<form
							noValidate
							className='space-y-2 mt-4'
							onKeyDown={handleFormKeyDown}
						>
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
										ref={withMask('decimal')}
										placeholder='0 %'
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
						<form
							noValidate
							className='space-y-2 mt-4'
							onKeyDown={handleFormKeyDown}
						>
							<Controller
								control={formAddress.control}
								name='postalCode'
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor='postal-code'>Frânquia:</FieldLabel>
										<Input
											{...field}
											id='postal-code'
											aria-invalid={fieldState.invalid}
											value={field.value ?? ''}
											placeholder='00000-000'
											className='text-left!'
											onChange={({ target: { value } }) =>
												field.onChange(maskPostalCode(value))
											}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Separator className='opacity-100 my-4' />
							<FieldGroup className='grid grid-cols-3 gap-2'>
								<Controller
									control={formAddress.control}
									name='amount'
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor='amount'>Valor:</FieldLabel>
											<Input
												{...field}
												ref={withMask('brl-currency')}
												id='amount'
												aria-invalid={fieldState.invalid}
												value={String(field.value || '')}
												placeholder='R$ 0,00'
												className='text-left!'
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Controller
									control={formAddress.control}
									name='percentage'
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor='percentage'>Percentual:</FieldLabel>
											<Input
												{...field}
												id='percentage'
												ref={withMask('percentage')}
												aria-invalid={fieldState.invalid}
												value={String(field.value || '')}
												placeholder='0 %'
												className='text-left!'
												onKeyDown={(e) => {
													if (
														e.code === 'Enter' &&
														formAddress.formState.isValid
													) {
														formAddress.handleSubmit(onSubmitAddress)();
													}
												}}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Field>
									<FieldLabel htmlFor='commission'>Comissão:</FieldLabel>
									<Input
										readOnly
										ref={withMask('brl-currency')}
										id='commission'
										value={
											// @ts-expect-error
											getNumericValue(formAddress.watch('amount') ?? 0) &&
											// @ts-expect-error
											getNumericValue(formAddress.watch('percentage') ?? 0)
												? // @ts-expect-error
													getNumericValue(formAddress.watch('amount') ?? 0) *
													(getNumericValue(
														// @ts-expect-error
														formAddress.watch('percentage') ?? 0,
													) /
														100)
												: undefined
										}
										placeholder='R$ 0,00'
										className='text-left!'
										tabIndex={-1}
										onKeyDown={(e) => {
											if (e.code === 'Enter' && formAddress.formState.isValid) {
												formAddress.handleSubmit(onSubmitAddress)();
											}
										}}
									/>
								</Field>
							</FieldGroup>
						</form>
					)}
					{type === 'franchise' && (
						<form
							noValidate
							className='space-y-2 mt-4'
							onKeyDown={handleFormKeyDown}
						>
							<Controller
								control={formFranchise.control}
								name='franchise'
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor='franchise'>Frânquia:</FieldLabel>
										<Input
											{...field}
											ref={withMask('brl-currency')}
											id='franchise'
											aria-invalid={fieldState.invalid}
											value={String(field.value || '')}
											placeholder='R$ 0,00'
											className='text-left!'
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Separator className='opacity-100 my-4' />
							<FieldGroup className='grid grid-cols-3 gap-2'>
								<Controller
									control={formFranchise.control}
									name='amount'
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor='amount'>Valor:</FieldLabel>
											<Input
												{...field}
												ref={withMask('brl-currency')}
												id='amount'
												aria-invalid={fieldState.invalid}
												value={String(field.value || '')}
												placeholder='R$ 0,00'
												className='text-left!'
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Controller
									control={formFranchise.control}
									name='percentage'
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor='percentage'>Percentual:</FieldLabel>
											<Input
												{...field}
												id='percentage'
												ref={withMask('percentage')}
												aria-invalid={fieldState.invalid}
												value={String(field.value || '')}
												placeholder='0 %'
												className='text-left!'
												onKeyDown={(e) => {
													if (
														e.code === 'Enter' &&
														formFranchise.formState.isValid
													) {
														formFranchise.handleSubmit(onSubmitFranchise)();
													}
												}}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Field>
									<FieldLabel htmlFor='commission'>Comissão:</FieldLabel>
									<Input
										readOnly
										ref={withMask('brl-currency')}
										id='commission'
										value={
											// @ts-expect-error
											getNumericValue(formFranchise.watch('amount') ?? 0) &&
											// @ts-expect-error
											getNumericValue(formFranchise.watch('percentage') ?? 0)
												? // @ts-expect-error
													getNumericValue(formFranchise.watch('amount') ?? 0) *
													(getNumericValue(
														// @ts-expect-error
														formFranchise.watch('percentage') ?? 0,
													) /
														100)
												: undefined
										}
										placeholder='R$ 0,00'
										className='text-left!'
										tabIndex={-1}
										onKeyDown={(e) => {
											if (
												e.code === 'Enter' &&
												formFranchise.formState.isValid
											) {
												formFranchise.handleSubmit(onSubmitFranchise)();
											}
										}}
									/>
								</Field>
							</FieldGroup>
						</form>
					)}
					{type === 'cancellation' && (
						<form noValidate className='mt-4' onKeyDown={handleFormKeyDown}>
							<Controller
								control={formCancel.control}
								name='effectivedAt'
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Data de cancelamento:</FieldLabel>
										{/* @ts-ignore */}
										<DatePickerInput {...field} invalid={fieldState.invalid} />
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
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
					<Button
						type='button'
						isPending={isPendingAddress || isPendingFranchise || isCanceling}
						disabled={!type}
						onClick={() => {
							if (type === 'address') {
								formAddress.handleSubmit(onSubmitAddress)();
							}

							if (type === 'franchise') {
								formFranchise.handleSubmit(onSubmitFranchise)();
							}

							if (type === 'cancellation') {
								formCancel.handleSubmit(onSubmitCancel)();
							}
						}}
					>
						Cadastrar
						<SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogSafeEndorsementById };
