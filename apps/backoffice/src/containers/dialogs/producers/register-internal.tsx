'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskCNPJ, maskCPF, maskNumber, maskPhone } from '@segwise/core/masks';
import {
	SchemaProducerRegisterInternal,
	SchemaProducerTypeOfPayment,
} from '@segwise/core/schemas';
import { translateProducerTypeOfPayment } from '@segwise/core/translate';
import type { ProducerRegisterInternal } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isCPF } from '@segwise/core/valids';
import { SaveIcon, XCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ProducerPaymentDays } from '@/containers/forms/producers/payment-days';
import { useProducersRegisterInternal } from '@/libraries/hooks/producers/use-producers-register-internal';

// Só mensal e quinzenal fazem sentido pra produtor interno (semanal não é
// usado hoje).
const TYPE_OF_PAYMENT_OPTIONS = [
	SchemaProducerTypeOfPayment.enum.monthly,
	SchemaProducerTypeOfPayment.enum.bi_weekly,
];

function DialogProducerRegisterInternal({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);

	const { mutate, isPending } = useProducersRegisterInternal();

	const { control, watch, handleSubmit, reset, setValue } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerRegisterInternal),
		defaultValues: {
			cpfOrCnpj: '',
			name: '',
			phone: '',
			email: '',
			startOfPayment: [],
			pix: '',
		},
	});

	function onSubmit(props: ProducerRegisterInternal) {
		mutate(props, {
			async onSuccess() {
				toast.success('CADASTRADO COM SUCESSO!');

				setOpen(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao cadastrar registro');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={(open) => [setOpen(open), reset()]}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-w-3xl'>
				<DialogHeader>
					<DialogTitle>Cadastrar Novo Produtor</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
				</DialogHeader>
				<Separator />
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='grid grid-cols-1 sm:grid-cols-2 gap-4'
				>
					<Controller
						control={control}
						name='cpfOrCnpj'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='cpfOrCnpj'>CPF ou CNPJ:</FieldLabel>
								<Input
									{...field}
									id='cpfOrCnpj'
									aria-invalid={fieldState.invalid}
									placeholder='Informar Documento'
									onChange={({ target: { value } }) => {
										field.onChange(
											value.length >= 11
												? isCPF(value)
													? maskCPF(value)
													: maskCNPJ(value)
												: maskNumber(value),
										);

										if (value.length === 0) {
											setValue('name', '');
										}
									}}
									maxLength={18}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='name'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='name'>Nome:</FieldLabel>
								<Input
									{...field}
									id='name'
									aria-invalid={fieldState.invalid}
									placeholder='Nome'
									onChange={({ target: { value } }) =>
										field.onChange(capitalizeFirstLetters(value))
									}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='email'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='email'>E-mail:</FieldLabel>
								<Input
									{...field}
									id='email'
									aria-invalid={fieldState.invalid}
									placeholder='exemplo@hospedagem.com'
									className='lowercase'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='phone'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='phone'>Celular:</FieldLabel>
								<Input
									{...field}
									id='phone'
									aria-invalid={fieldState.invalid}
									placeholder='(00) 00000-0000'
									onChange={({ target: { value } }) =>
										field.onChange(maskPhone(value))
									}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='typeOfPayment'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='typeOfPayment'>
									Tipo de Pagamento:
								</FieldLabel>
								<Select
									{...field}
									value={field.value || ''}
									onValueChange={field.onChange}
								>
									<SelectTrigger
										id='typeOfPayment'
										aria-invalid={fieldState.invalid}
									>
										<SelectValue placeholder='Selecionar' />
									</SelectTrigger>
									<SelectContent>
										{TYPE_OF_PAYMENT_OPTIONS.map((item) => (
											<SelectItem key={item} value={item}>
												{capitalizeFirstLetters(
													translateProducerTypeOfPayment(item),
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='percentage'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='percentage'>Comissão:</FieldLabel>
								<Input
									{...field}
									id='percentage'
									value={field.value ? String(field.value) : ''}
									aria-invalid={fieldState.invalid}
									type='number'
									placeholder='% 0'
									min={1}
									max={100}
									maxLength={3}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='startOfPayment'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='startOfPayment'>
									{watch('typeOfPayment') === 'bi_weekly'
										? 'Dias de Pagamento:'
										: 'Dia de Pagamento:'}
								</FieldLabel>
								<ProducerPaymentDays
									id='startOfPayment'
									typeOfPayment={watch('typeOfPayment')}
									value={field.value}
									onChange={field.onChange}
									invalid={fieldState.invalid}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='pix'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='pix'>Chave PIX:</FieldLabel>
								<Input
									{...field}
									id='pix'
									value={field.value || ''}
									aria-invalid={fieldState.invalid}
									placeholder='Informar Chave PIX'
									className='uppercase'
									onChange={({ target: { value } }) =>
										field.onChange(!value ? null : value.trim())
									}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</form>
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
						onClick={handleSubmit(onSubmit)}
					>
						Confirmar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogProducerRegisterInternal };
