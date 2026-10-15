'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskNumber, maskPhone } from '@segwise/core/masks';
import {
	SchemaProducerAreaOfActivity,
	SchemaProducerRegister,
	SchemaProducerTypeOfPayment,
} from '@segwise/core/schemas';
import {
	translateProducerType,
	translateProducerTypeOfPayment,
} from '@segwise/core/translate';
import type { ProducerRegister } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { KeyRoundIcon, SaveIcon, XCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, type DefaultValues, useForm } from 'react-hook-form';
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
	FieldDescription,
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
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ProducerAccessCredentials } from '@/containers/dialogs/producers/access';
import { ProducerPaymentDays } from '@/containers/forms/producers/payment-days';
import { generatePassword } from '@/functions/auth/generate-password';
import { useProducersRegister } from '@/libraries/hooks/producers/use-producers-register';

const MESSAGE = `Novidade\nA {{DISPLAY_NAME}} em parceria com a Segwise vem ofertar a promoção\n\nGANHE EM DOBRO\n1 - Orientações em caso de sinistro\n2 - Consulta veicular\n3 - Acesso direto às assistências das seguradoras\n4 - Plataforma de compra e venda de veículos mais segura ( apenas clientes segwise/xcar tem acesso)\n5 - Inclua todos os seguros da família, ganhe agilidade na consulta das renovações e acesso às assistências\n\nBaixe agora o aplicativo *SEGWISE*\n\nUtilize o código *{{CODE}}*\n\nDescontos reais e exclusivos na renovação ou aquisição do seu seguro\n\nGaranta seus benefícios\n\nou acesse pelo link abaixo:`;

function buildDefaults(): DefaultValues<ProducerRegister> {
	return {
		name: '',
		phone: '',
		email: '',
		referral: '',
		startOfPayment: [],
		pix: '',
		message: MESSAGE,
		password: '',
	};
}

function DialogProducerPartnerRegister({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);

	// Preenchido após o cadastro: troca o conteúdo do dialog pelo acesso do parceiro.
	const [access, setAccess] = useState<{
		accessUrl: string;
		passwordApplied: boolean;
	} | null>(null);

	// Depois que o admin mexe na senha, o celular deixa de preenchê-la.
	const [passwordEdited, setPasswordEdited] = useState<boolean>(false);

	const [defaults] = useState(buildDefaults);

	const { mutate, isPending, reset: resetMutation } = useProducersRegister();

	const { control, watch, handleSubmit, reset, setValue } = useForm<
		ProducerRegister,
		unknown,
		ProducerRegister
	>({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerRegister) as never,
		defaultValues: defaults,
	});

	// Fechar descarta tudo: a senha do estado do formulário é trocada por uma nova e
	// o cache da mutation (que guarda o que foi enviado) é limpo.
	function onOpenChange(next: boolean) {
		setOpen(next);

		if (!next) {
			setAccess(null);
			setPasswordEdited(false);
			reset(buildDefaults());
			resetMutation();
		}
	}

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
				onSuccess({ accessUrl, passwordApplied }) {
					toast.success('CADASTRADO COM SUCESSO!');

					setAccess({ accessUrl, passwordApplied });
				},
				onError(error) {
					toast.error(error.message || 'Falha ao cadastrar registro');
				},
				// A senha enviada fica no cache da mutation até o gc: limpa já.
				onSettled() {
					resetMutation();
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			{access ? (
				<DialogContent
					className='max-w-lg'
					// A senha só aparece aqui: clique fora ou Esc não podem fechar sem querer.
					onInteractOutside={(event) => event.preventDefault()}
					onEscapeKeyDown={(event) => event.preventDefault()}
				>
					<ProducerAccessCredentials
						name={watch('name')}
						email={watch('email')}
						password={watch('password')}
						accessUrl={access.accessUrl}
						passwordApplied={access.passwordApplied}
						onDone={() => onOpenChange(false)}
					/>
				</DialogContent>
			) : (
				<DialogContent className='max-w-5xl h-screen'>
					<DialogHeader>
						<DialogTitle>Cadastrar Novo Parceiro</DialogTitle>
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
								name='name'
								render={({ field, fieldState }) => (
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-1'
									>
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
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-1'
									>
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
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-1'
									>
										<FieldLabel htmlFor='phone'>Celular:</FieldLabel>
										<Input
											{...field}
											id='phone'
											aria-invalid={fieldState.invalid}
											placeholder='(00) 00000-0000'
											onChange={({ target: { value } }) => {
												const phone = maskPhone(value);

												field.onChange(phone);

												if (!passwordEdited) {
													setValue('password', maskNumber(phone), {
														shouldValidate: true,
													});
												}
											}}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								control={control}
								name='password'
								render={({ field, fieldState }) => (
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-full'
									>
										<FieldLabel htmlFor='password'>Senha de acesso:</FieldLabel>
										<div className='flex flex-row items-center gap-x-2'>
											<Input
												{...field}
												id='password'
												autoComplete='off'
												aria-invalid={fieldState.invalid}
												placeholder='Padrão: número do celular'
												onChange={({ target: { value } }) => {
													field.onChange(value);
													setPasswordEdited(true);
												}}
											/>
											<Button
												type='button'
												variant='outline'
												onClick={() => {
													setValue('password', generatePassword(), {
														shouldValidate: true,
													});
													setPasswordEdited(true);
												}}
											>
												<KeyRoundIcon /> Gerar
											</Button>
										</div>
										<FieldDescription className='text-xs'>
											{passwordEdited
												? 'Senha definida manualmente: mudar o celular não altera mais a senha.'
												: 'Acompanha o celular (só números) até você editar a senha.'}
										</FieldDescription>
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
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-1'
									>
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
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-1'
									>
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
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-1'
									>
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
								name='type'
								render={({ field, fieldState }) => (
									<Field
										data-invalid={fieldState.invalid}
										className='col-span-1'
									>
										<FieldLabel htmlFor='type'>Área de Atuação:</FieldLabel>
										<Select
											{...field}
											value={field.value || ''}
											onValueChange={field.onChange}
										>
											<SelectTrigger
												id='type'
												aria-invalid={fieldState.invalid}
											>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
											<SelectContent className='max-h-70'>
												{SchemaProducerAreaOfActivity.options
													.slice()
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
											<div className='text-right text-xs leading-tight text-muted-foreground'>
												<span className='block'>Exemplo:</span>
												<span className='block font-medium uppercase'>
													XCAR
												</span>
											</div>
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
			)}
		</Dialog>
	);
}

export { DialogProducerPartnerRegister };
