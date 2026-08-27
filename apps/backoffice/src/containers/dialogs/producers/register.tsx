'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskCNPJ, maskCPF, maskNumber, maskPhone } from '@segwise/core/masks';
import {
	SchemaProducerRegister,
	SchemaProducerStartOfProductionPayment,
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
import { Textarea } from '@/components/ui/textarea';
import { useProducersRegister } from '@/libraries/hooks/producers/use-producers-register';

function DialogProducerRegister({
	id: _id,
	children,
}: React.PropsWithChildren<{
	id?: string;
}>) {
	const [open, setOpen] = useState<boolean>(false);

	const { mutate, isPending } = useProducersRegister();

	const { control, handleSubmit, reset, setValue } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerRegister),
		defaultValues: {
			cpfOrCnpj: '',
			name: '',
			phone: '',
			email: '',
			referral: '',
			pix: '',
			message: `Novidade\n{{DISPLAY_NAME}} em parceria com a segwise vem ofertar a promoção\n\nGANHE EM DOBRO\n\n1 - Orientações em caso de sinistro\n2 - Consulta veicular\n3 - Acesso direto às assistências das seguradoras\n4 - Plataforma de compra e venda de veículos mais segura ( apenas clientes segwise/xcar tem acesso)\n5 - Inclua todos os seguros da família, ganhe agilidade na consulta das renovações e acesso às assistências\n\nBaixe agora o aplicativo *SEGWISE*\n\nUtilize o código {{CODE}}\n\nGaranta seus benefícios: Cashback de até R$500,00 na contratação ou renovação do seu seguro\n\nou acesse pelo link abaixo:`,
		},
	});

	function onSubmit(props: ProducerRegister) {
		mutate(
			{
				...props,
				...(props.message && {
					message: props.message
						.replaceAll('{{DISPLAY_NAME}}', props.name)
						.replaceAll('{{CODE}}', props.referral.toUpperCase()),
				}),
			},
			{
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
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={(open) => [setOpen(open), reset()]}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-w-5xl h-screen'>
				<DialogHeader>
					<DialogTitle>Cadastrar Novo Produtor</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
				</DialogHeader>
				<Separator />
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='grid grid-cols-1 sm:grid-cols-[55%_auto] gap-4 overflow-scroll'
				>
					<FieldGroup className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
											<SelectItem
												value={SchemaProducerTypeOfPayment.enum.monthly}
											>
												{capitalizeFirstLetters(
													translateProducerTypeOfPayment(
														SchemaProducerTypeOfPayment.enum.monthly,
													),
												)}
											</SelectItem>
											{/* {SchemaProducerTypeOfPayment.options.map((item) => (
												<SelectItem key={item} value={item}>
													{capitalizeFirstLetters(
														translateProducerTypeOfPayment(item),
													)}
												</SelectItem>
											))} */}
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
											{SchemaProducerStartOfProductionPayment.values
												.values()
												.toArray()
												.map((item) => (
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
									<FieldLabel htmlFor='type'>Tipo do Parceiro:</FieldLabel>
									<Select
										{...field}
										value={field.value || ''}
										onValueChange={field.onChange}
									>
										<SelectTrigger id='type' aria-invalid={fieldState.invalid}>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent className='max-h-70'>
											<SelectItem value={SchemaProducerType.enum.producer}>
												{capitalizeFirstLetters(
													translateProducerType(
														SchemaProducerType.enum.producer,
													),
												)}
											</SelectItem>
											<SelectSeparator />
											{SchemaProducerType.options
												.filter((e) => e !== SchemaProducerType.enum.producer)
												.sort((a, b) =>
													translateProducerType(a).localeCompare(
														translateProducerType(b),
													),
												)
												.map((item) => (
													<SelectItem key={item} value={item}>
														{capitalizeFirstLetters(
															translateProducerType(item),
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
					<FieldGroup>
						<Controller
							control={control}
							name='message'
							render={({ field, fieldState }) => (
								<Field
									data-invalid={fieldState.invalid}
									className='col-span-full'
								>
									<FieldLabel htmlFor='message'>
										Mensagem de Indicação:{' '}
									</FieldLabel>
									<Textarea
										{...field}
										id='message'
										value={field.value || ''}
										aria-invalid={fieldState.invalid}
										placeholder='Informar Código'
										className='uppercase min-h-40'
										onChange={({ target: { value } }) =>
											field.onChange(!value ? null : value)
										}
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>
					<FieldGroup>
						<Controller
							control={control}
							name='pix'
							render={({ field, fieldState }) => (
								<Field
									data-invalid={fieldState.invalid}
									className='col-span-full'
								>
									<FieldLabel htmlFor='pix'>Chave PIX: </FieldLabel>
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
