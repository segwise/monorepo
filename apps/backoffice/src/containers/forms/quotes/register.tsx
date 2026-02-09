'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskCPF, maskDateString, maskPhone } from '@segwise/core/masks';
import { SchemaQuoteRegister } from '@segwise/core/schemas';
import {
	translateMaritalStatus,
	translateQuoteStatus,
} from '@segwise/core/translate';
import type { QuoteRegister } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isDateString } from '@segwise/core/valids';
import { format, parse } from 'date-fns';
import {
	CarIcon,
	ClipboardIcon,
	SaveIcon,
	Trash2Icon,
	UserCircle2Icon,
} from 'lucide-react';
import { Fragment } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { placeholder } from '@/config/placeholder';
import { useProducers } from '@/libraries/hooks/producers/use-producers';
import { useProfessions } from '@/libraries/hooks/use-professions';

function FormQuoteRegister() {
	const { data: producers } = useProducers({
		simple: true,
	});

	const { data: professions } = useProfessions({
		simple: true,
	});

	const {
		control,
		handleSubmit,
		formState: { isDirty },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaQuoteRegister),
		defaultValues: {
			status: 'waiting',
			type: 'car',
			requestAt: '',
			insured: {
				cpf: '',
				name: '',
				birth: '',
				phone: '',
			},
			vehicle: {
				plate: '',
				model: '',
				yearOfManufacture: '',
				modelYear: '',
				overnightPostalCode: '',
				additional: {
					residence: {},
					work: {},
					school: {},
				},
			},
			driver: {
				cpf: '',
				name: '',
				birth: '',
				phone: '',
			},
		},
	});

	function onSubmit(_props: QuoteRegister) {}

	return (
		<Fragment>
			<Card className='overflow-hidden'>
				<CardContent className='relative'>
					<Controller
						control={control}
						name='producer'
						render={({ field, fieldState }) => (
							<Field
								data-invalid={fieldState.invalid}
								className='w-fit flex flex-row items-center justify-end gap-x-2 absolute -top-6 right-0'
							>
								<FieldLabel className='text-sm font-medium w-fit!'>
									Produtor:
								</FieldLabel>
								<Select
									{...field}
									value={!field.value ? '' : field.value}
									onValueChange={(value) =>
										field.onChange(value === 'clear' ? null : value)
									}
								>
									<SelectTrigger
										aria-invalid={fieldState.invalid}
										className='rounded-none rounded-bl-sm border-0 border-l border-b text-left'
									>
										<SelectValue placeholder='Nenhum produtor' />
									</SelectTrigger>
									<SelectContent align='end' side='bottom'>
										{producers?.map(({ id, avatar, name, contact }) => (
											<SelectItem key={id} value={id}>
												<div className='flex flex-row items-center justify-start gap-x-3'>
													<Avatar className='size-8 rounded-full border'>
														<AvatarImage
															src={avatar || placeholder.user}
															width={128}
															height={128}
															alt={`Produtor - ${capitalizeFirstLetters(name)}`}
														/>
														<AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
													</Avatar>
													<div className='leading-none'>
														<span className='text-xs/tight font-medium block'>
															{capitalizeFirstLetters(name)}
														</span>
														<span className='text-xs/tight text-muted-foreground block'>
															{maskPhone(contact.phone)}
														</span>
													</div>
												</div>
											</SelectItem>
										))}
										<SelectSeparator />
										<SelectItem
											value='clear'
											variant='destructive'
											className='text-center items-center justify-center pr-6'
										>
											<div className='flex flex-row items-center justify-center text-center gap-x-3'>
												<Trash2Icon /> Limpar
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<form id='form-quote-register' onSubmit={handleSubmit(onSubmit)}>
						<FieldGroup>
							<FieldGroup>
								<FieldSet>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<ClipboardIcon />
											</div>
											Informativo
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='grid grid-cols-4'>
									<Controller
										control={control}
										name='type'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Categoria do Seguro:</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger
														aria-invalid={fieldState.invalid}
														className='pointer-events-none'
													>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='car'>
															<div className='flex flex-row items-center justify-start gap-x-2'>
																<CarIcon /> <span>Automóvel</span>
															</div>
														</SelectItem>
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
										name='renewal'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Tipo do Seguro:</FieldLabel>
												<Select
													{...field}
													value={
														field.value === true
															? 'renewal'
															: field.value === false
																? 'no_renewal'
																: undefined
													}
													onValueChange={(value) =>
														field.onChange(value === 'renewal')
													}
												>
													<SelectTrigger aria-invalid={fieldState.invalid}>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='no_renewal'>
															Seguro Novo
														</SelectItem>
														<SelectItem value='renewal'>Renovação</SelectItem>
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
										name='status'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Status:</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger aria-invalid={fieldState.invalid}>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='waiting'>
															{translateQuoteStatus('waiting')}
														</SelectItem>
														<SelectItem value='quoting'>
															{translateQuoteStatus('quoting')}
														</SelectItem>
														<SelectItem value='quoted'>
															{translateQuoteStatus('quoted')}
														</SelectItem>
														<SelectItem value='sent'>
															{translateQuoteStatus('sent')}
														</SelectItem>
														<SelectItem value='confirmed'>
															{translateQuoteStatus('confirmed')}
														</SelectItem>
														<SelectSeparator />
														<SelectItem value='recused' variant='destructive'>
															{translateQuoteStatus('recused')}
														</SelectItem>
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
										name='requestAt'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Data da Solicitação:</FieldLabel>
												<Input
													{...field}
													aria-invalid={fieldState.invalid}
													placeholder='00/00/0000'
													value={
														typeof field.value === 'string'
															? isDateString(field.value)
																? format(
																		parse(
																			field.value,
																			'dd/MM/yyyy',
																			new Date(),
																		),
																		'dd/MM/yyyy',
																	)
																: maskDateString(field.value)
															: undefined
													}
													onChange={({ target: { value } }) =>
														field.onChange(
															isDateString(value)
																? parse(value, 'dd/MM/yyyy', new Date())
																: maskDateString(value),
														)
													}
													maxLength={10}
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
								</FieldGroup>
							</FieldGroup>
							<Separator />
							<FieldGroup>
								<FieldSet>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<UserCircle2Icon />
											</div>
											Segurado
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='grid grid-cols-4'>
									<Controller
										control={control}
										name='insured.cpf'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>CPF:</FieldLabel>
												<Input
													{...field}
													aria-invalid={fieldState.invalid}
													placeholder='000.000.000-00'
													onChange={({ target: { value } }) =>
														field.onChange(maskCPF(value))
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
										name='insured.name'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Nome Completo:</FieldLabel>
												<Input
													{...field}
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
										name='insured.birth'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Nascimento:</FieldLabel>
												<Input
													{...field}
													aria-invalid={fieldState.invalid}
													placeholder='00/00/0000'
													value={
														typeof field.value === 'string'
															? isDateString(field.value)
																? format(
																		parse(
																			field.value,
																			'dd/MM/yyyy',
																			new Date(),
																		),
																		'dd/MM/yyyy',
																	)
																: maskDateString(field.value)
															: undefined
													}
													onChange={({ target: { value } }) =>
														field.onChange(
															isDateString(value)
																? parse(value, 'dd/MM/yyyy', new Date())
																: maskDateString(value),
														)
													}
													maxLength={10}
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<Controller
										control={control}
										name='insured.phone'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Celular:</FieldLabel>
												<Input
													{...field}
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
										name='insured.maritalStatus'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Estado Cívil:</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger aria-invalid={fieldState.invalid}>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='single'>
															{translateMaritalStatus('single')}
														</SelectItem>
														<SelectItem value='common_law_marriage'>
															{translateMaritalStatus('common_law_marriage')}
														</SelectItem>
														<SelectItem value='separated'>
															{translateMaritalStatus('separated')}
														</SelectItem>
														<SelectItem value='divorced'>
															{translateMaritalStatus('divorced')}
														</SelectItem>
														<SelectItem value='married'>
															{translateMaritalStatus('married')}
														</SelectItem>
														<SelectItem value='widowed'>
															{translateMaritalStatus('widowed')}
														</SelectItem>
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
										name='insured.qualificationTime'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>Tempo de Habilitação:</FieldLabel>
												<Select
													{...field}
													value={field.value ? String(field.value) : ''}
													onValueChange={field.onChange}
												>
													<SelectTrigger aria-invalid={fieldState.invalid}>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='1'>1 anos</SelectItem>
														<SelectItem value='2'>2 anos</SelectItem>
														<SelectItem value='3'>3 anos</SelectItem>
														<SelectItem value='4'>4 anos</SelectItem>
														<SelectItem value='5'>5 anos</SelectItem>
														<SelectItem value='6'>6 anos</SelectItem>
														<SelectItem value='7'>7 anos</SelectItem>
														<SelectItem value='8'>8 anos</SelectItem>
														<SelectItem value='9'>9 anos</SelectItem>
														<SelectItem value='99'>+10 anos</SelectItem>
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
										name='insured.profession'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel>
													Profissão:
													<sup className='text-muted-foreground ml-2'>
														( Opcional )
													</sup>
												</FieldLabel>
												<Select
													{...field}
													value={field.value || ''}
													onValueChange={field.onChange}
												>
													<SelectTrigger aria-invalid={fieldState.invalid}>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent
														position='item-aligned'
														align='end'
														side='bottom'
													>
														{professions?.map(({ code, name }) => (
															<SelectItem key={code} value={name}>
																{capitalizeFirstLetters(name)}
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
								</FieldGroup>
							</FieldGroup>
							<Separator />
							<FieldGroup>
								<FieldSet>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<CarIcon />
											</div>
											Dados do Veículo
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='grid grid-cols-4'>
									<Field>
										<FieldLabel>
											Placa:
											<sup className='text-muted-foreground ml-2'>
												( Opcional )
											</sup>
										</FieldLabel>
										<Input placeholder='AAA-0000 / AAA0A00' />
									</Field>
									<Field>
										<FieldLabel>Marca:</FieldLabel>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
									<Field>
										<FieldLabel>Modelo:</FieldLabel>
										<Input placeholder='Modelo' />
									</Field>
									<FieldGroup className='flex flex-row gap-x-0!'>
										<Field>
											<FieldLabel>Ano de Fabricação:</FieldLabel>
											<Input
												placeholder='0000'
												className='rounded-r-none border-r-0'
											/>
										</Field>
										<Field>
											<FieldLabel>Ano do Modelo:</FieldLabel>
											<Input placeholder='0000' className='rounded-l-none' />
										</Field>
									</FieldGroup>
									<Field>
										<FieldLabel>
											Chassi:
											<sup className='text-muted-foreground ml-2'>
												( Opcional )
											</sup>
										</FieldLabel>
										<Input placeholder='Chassi' />
									</Field>
									<Field>
										<FieldLabel>Uso do Veículo:</FieldLabel>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
									<Field>
										<FieldLabel>Câmbio:</FieldLabel>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder='Selecionar' />
											</SelectTrigger>
										</Select>
									</Field>
									<Field>
										<FieldLabel>CEP de Pernoite:</FieldLabel>
										<Input placeholder='00000-000' />
									</Field>
									<FieldGroup className='flex flex-row gap-x-0!'>
										<Field>
											<FieldLabel>Reside Em:</FieldLabel>
											<Select>
												<SelectTrigger className='rounded-r-none border-r-0'>
													<SelectValue placeholder='Selecionar' />
												</SelectTrigger>
											</Select>
										</Field>
										<Field>
											<FieldLabel>Tipo de Garagem:</FieldLabel>
											<Select>
												<SelectTrigger className='rounded-l-none'>
													<SelectValue placeholder='Selecionar' />
												</SelectTrigger>
											</Select>
										</Field>
									</FieldGroup>
									<FieldGroup className='flex flex-row gap-x-0!'>
										<Field>
											<FieldLabel>Trabalho:</FieldLabel>
											<Select>
												<SelectTrigger className='rounded-r-none border-r-0'>
													<SelectValue placeholder='Selecionar' />
												</SelectTrigger>
											</Select>
										</Field>
										<Field>
											<FieldLabel>Tipo de Garagem:</FieldLabel>
											<Select>
												<SelectTrigger className='rounded-l-none'>
													<SelectValue placeholder='Selecionar' />
												</SelectTrigger>
											</Select>
										</Field>
									</FieldGroup>
									<FieldGroup className='flex flex-row gap-x-0!'>
										<Field>
											<FieldLabel>Estuda:</FieldLabel>
											<Select>
												<SelectTrigger className='rounded-r-none border-r-0'>
													<SelectValue placeholder='Selecionar' />
												</SelectTrigger>
											</Select>
										</Field>
										<Field>
											<FieldLabel>Tipo de Garagem:</FieldLabel>
											<Select>
												<SelectTrigger className='rounded-l-none'>
													<SelectValue placeholder='Selecionar' />
												</SelectTrigger>
											</Select>
										</Field>
									</FieldGroup>
								</FieldGroup>
								<FieldGroup className='mt-3'>
									<FieldSet className='gap-0!'>
										<FieldLegend className='mb-1'>Mais Informações</FieldLegend>
										<FieldDescription className='text-xs'>
											Para uma cotação mais eficiente
										</FieldDescription>
									</FieldSet>
									<FieldGroup className='gap-1.5!'>
										<Field orientation='horizontal' className='gap-1.5'>
											<Checkbox />
											<Label className='font-normal text-xs text-[0.8rem]'>
												Blindado
											</Label>
										</Field>
										<Field orientation='horizontal' className='gap-1.5'>
											<Checkbox />
											<Label className='font-normal text-xs text-[0.8rem]'>
												Kit Gás
											</Label>
										</Field>
										<Field orientation='horizontal' className='gap-1.5'>
											<Checkbox />
											<Label className='font-normal text-xs text-[0.8rem]'>
												Segurado é o proprietário do veículo
											</Label>
										</Field>
										<Field orientation='horizontal' className='gap-1.5'>
											<Checkbox />
											<Label className='font-normal text-xs text-[0.8rem]'>
												Financiado
											</Label>
										</Field>
										<Field orientation='horizontal' className='gap-1.5'>
											<Checkbox />
											<Label className='font-normal text-xs text-[0.8rem]'>
												Pessoas entre 18 a 26 anos utilizam o veículo
											</Label>
										</Field>
									</FieldGroup>
								</FieldGroup>
							</FieldGroup>
							<Separator />
							<FieldGroup>
								<FieldSet>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<UserCircle2Icon />
											</div>
											Principal Condutor
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='grid grid-cols-4'>
									<Field>
										<FieldLabel>CPF:</FieldLabel>
										<InputGroup>
											<InputGroupAddon
												align='inline-start'
												className=' border-r pr-3 mr-1 h-full'
											>
												<Label className='z-1'>O mesmo</Label> <Checkbox />
											</InputGroupAddon>
											<InputGroupInput placeholder='000.000.000-00' />
										</InputGroup>
									</Field>
									<Field>
										<FieldLabel>Nome Completo:</FieldLabel>
										<Input placeholder='Nome Completo' />
									</Field>
									<Field>
										<FieldLabel>Nascimento:</FieldLabel>
										<Input placeholder='00/00/0000' />
									</Field>
									<Field>
										<FieldLabel>Celular:</FieldLabel>
										<Input placeholder='(00) 00000-0000' />
									</Field>
								</FieldGroup>
							</FieldGroup>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
			<Button
				type='submit'
				form='form-quote-register'
				className='w-full'
				disabled={!isDirty}
			>
				<SaveIcon /> Salvar Registro
			</Button>
		</Fragment>
	);
}

export { FormQuoteRegister };
