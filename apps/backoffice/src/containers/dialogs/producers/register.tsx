'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskCNPJ, maskCPF, maskPhone } from '@segwise/core/masks';
import {
	SchemaProducerRegister,
	SchemaProducerType,
	SchemaProducerTypeOfPayment,
} from '@segwise/core/schemas';
import {
	translateProducerType,
	translateProducerTypeOfPayment,
} from '@segwise/core/translate';
import type { ProducerRegister } from '@segwise/core/types';
import { capitalizeFirstLetters, generateReferral } from '@segwise/core/utils';
import { isCPF } from '@segwise/core/valids';
import { SaveIcon, Trash2Icon, XCircleIcon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
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
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useProducersRegister } from '@/libraries/hooks/producers/use-producers-register';
import { useCpfOrCnpj } from '@/libraries/hooks/use-cpf-or-cnpj';

function DialogProducerRegister({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);

	const { mutate, isPending } = useProducersRegister();

	const { control, handleSubmit, reset, watch, setValue, clearErrors } =
		useForm({
			mode: 'all',
			criteriaMode: 'all',
			reValidateMode: 'onChange',
			resolver: zodResolver(SchemaProducerRegister),
			defaultValues: {
				type: null,
				cpfOrCnpj: '',
				name: '',
				phone: '',
				email: '',
				percentage: null,
				typeOfPayment: 'monthly',
				startOfPayment: 16,
				referral: '',
			},
		});

	const { data } = useCpfOrCnpj(watch('cpfOrCnpj'));

	function onSubmit(props: ProducerRegister) {
		mutate(props, {
			async onSuccess(_data, _variables, _mutate, ctx) {
				toast.success('CADASTRADO COM SUCESSO!');

				await Promise.all([
					ctx.client.invalidateQueries({
						queryKey: ['producers', 'simple'],
					}),
					ctx.client.invalidateQueries({
						queryKey: ['producers', 'simple', 'full'],
					}),
				]);

				setOpen(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao cadastrar registro');
			},
		});
	}

	useEffect(() => {
		if (data) {
			setValue('name', capitalizeFirstLetters(data.name));

			clearErrors('name');
		}
	}, [data, setValue, clearErrors]);

	return (
		<Dialog open={open} onOpenChange={(open) => [setOpen(open), reset()]}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cadastrar Novo Produtor</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
				</DialogHeader>
				<Separator />
				<form onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup className='grid grid-cols-2 gap-4'>
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
													: value,
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
									<FieldLabel htmlFor='name'>Nome Completo:</FieldLabel>
									<Input
										{...field}
										id='name'
										aria-invalid={fieldState.invalid}
										placeholder='Nome Completo'
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
									<FieldLabel htmlFor='email'>E-mail</FieldLabel>
									<Input
										{...field}
										id='email'
										aria-invalid={fieldState.invalid}
										placeholder='exemplo@hospedage.com'
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
											{SchemaProducerTypeOfPayment.options.map((item) => (
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
										Dia de Pagamento:
									</FieldLabel>
									<Select
										{...field}
										value={field.value ? String(field.value) : ''}
										onValueChange={(value) => field.onChange(Number(value))}
									>
										<SelectTrigger
											id='startOfPayment'
											aria-invalid={fieldState.invalid}
										>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent>
											{[1, 3, 5, 8, 10, 16].map((item) => (
												<SelectItem key={item} value={String(item)}>
													Dia {item}
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
							name='type'
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid} className='col-span-1'>
									<FieldLabel htmlFor='type'>
										Tipo do Parceiro:{' '}
										<sup className='text-muted-foreground'>( Opcional )</sup>
									</FieldLabel>
									<Select
										{...field}
										value={field.value || ''}
										onValueChange={(value) =>
											field.onChange(value === 'clear' ? null : value)
										}
									>
										<SelectTrigger id='type' aria-invalid={fieldState.invalid}>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent>
											{SchemaProducerType.options.map((item) => (
												<SelectItem key={item} value={item}>
													{capitalizeFirstLetters(translateProducerType(item))}
												</SelectItem>
											))}
											{field.value && (
												<Fragment>
													<SelectSeparator />
													<SelectItem
														value='clear'
														variant='destructive'
														className='text-center items-center justify-center'
														showIndicator={false}
													>
														<div className='flex flex-row items-center justify-center text-center gap-x-3'>
															<Trash2Icon /> Limpar
														</div>
													</SelectItem>
												</Fragment>
											)}
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
							name='referral'
							render={({ field, fieldState }) => (
								<Field
									data-invalid={fieldState.invalid}
									className='col-span-full'
								>
									<FieldSet className='flex flex-row items-center justify-between'>
										<FieldLabel htmlFor='referral'>
											Código de Indicação:{' '}
										</FieldLabel>
										<Button
											type='button'
											variant='link'
											size='sm'
											className='text-xs'
											onClick={() => field.onChange(generateReferral())}
										>
											Gerar Código Aleatório
										</Button>
									</FieldSet>
									<Input
										{...field}
										id='referral'
										aria-invalid={fieldState.invalid}
										placeholder='Informar Código'
										className='uppercase'
										onChange={({ target: { value } }) =>
											field.onChange(value.trim())
										}
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>
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

export { DialogProducerRegister };
