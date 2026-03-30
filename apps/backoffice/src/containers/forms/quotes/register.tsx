'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	maskCPF,
	maskDateString,
	maskNumber,
	maskPhone,
	maskPlate,
	maskPostalCode,
} from '@segwise/core/masks';
import { SchemaQuoteRegister } from '@segwise/core/schemas';
import {
	translateGarage,
	translateGarageSchool,
	translateGarageWork,
	translateMaritalStatus,
	translateQuoteStatus,
	translateResidence,
	translateVehicleExchange,
	translateVehicleUsage,
} from '@segwise/core/translate';
import type { QuoteRegister } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isDateString } from '@segwise/core/valids';
import { differenceInYears, format, isDate, parse } from 'date-fns';
import {
	CarIcon,
	ChevronLeftIcon,
	ClipboardIcon,
	SaveIcon,
	Trash2Icon,
	UserCircle2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ButtonBack } from '@/components/ui/button/back';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox';
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
	InputGroupText,
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
import { useProducersSimple } from '@/libraries/hooks/producers/use-producers';
import { useQuotesRegister } from '@/libraries/hooks/quotes/use-quotes-register';
import { useProfessionsSimple } from '@/libraries/hooks/use-professions';
import { useVehiclesManufacturers } from '@/libraries/hooks/vehicles/use-vehicles-manufacturers';

function FormQuoteRegister() {
	const { push } = useRouter();

	const [theInsuredPartyIsTheDriver, setTheInsuredPartyIsTheDriver] =
		useState<boolean>(false);

	const { mutate, isPending } = useQuotesRegister();

	const { data: producers } = useProducersSimple();

	const { data: professions } = useProfessionsSimple();

	const { data: manufacturers } = useVehiclesManufacturers();

	const {
		control,
		handleSubmit,
		setValue,
		clearErrors,
		getValues,
		reset,
		formState: { isDirty },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaQuoteRegister),
		defaultValues: {
			producer: null,
			status: 'waiting',
			modality: 'car',
			requestAt: new Date(),
			insured: {
				cpf: '',
				name: '',
				birth: '',
				phone: '',
			},
			vehicle: {
				plate: null,
				model: '',
				modelYear: '',
				overnightPostalCode: '',
				additional: {
					armored: false,
					gasKit: false,
					theInsuredIsTheOwner: false,
					funded: false,
					driversUnder26: false,
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

	function onSubmit(props: QuoteRegister) {
		mutate(props, {
			onSuccess(data) {
				toast.success(data.message || 'Cadastrado com sucesso');

				setTheInsuredPartyIsTheDriver(false);
				// @ts-expect-error
				reset({
					producer: null,
					renewal: null,
					status: 'waiting',
					modality: 'car',
					requestAt: new Date(),
					insured: {
						cpf: '',
						name: '',
						birth: '',
						phone: '',
						profession: null,
						maritalStatus: null,
					},
					vehicle: {
						plate: null,
						model: '',
						modelYear: '',
						manufacturer: null,
						overnightPostalCode: '',
						usage: '',
						exchange: '',
						additional: {
							residence: {
								type: null,
								garage: null,
							},
							work: null,
							school: null,
							armored: false,
							gasKit: false,
							theInsuredIsTheOwner: false,
							funded: false,
							driversUnder26: false,
						},
						chassi: null,
					},
					driver: {
						cpf: '',
						name: '',
						birth: '',
						phone: '',
					},
				});

				setTimeout(() => {
					clearErrors();
				}, 100);

				push('/quotes');
			},
			onError(error) {
				toast.error(error.message || 'Falha ao registrar interesse de cotação');
			},
		});
	}

	return (
		<Fragment>
			<div className='flex flex-row items-center justify-between **:gap-x-2'>
				<div />
				<div className='flex flex-row items-center justify-end'>
					<Controller
						control={control}
						name='producer'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} orientation='horizontal'>
								<FieldLabel>Produtor:</FieldLabel>
								<Select
									{...field}
									value={!field.value ? '' : field.value || ''}
									onValueChange={(value) =>
										field.onChange(value === 'clear' ? null : value)
									}
								>
									<SelectTrigger aria-invalid={fieldState.invalid}>
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
														<span className='text-xs/tight font-medium block text-left'>
															{capitalizeFirstLetters(name)}
														</span>
														{contact.phone && (
															<span className='text-xs/tight text-muted-foreground block text-left'>
																{maskPhone(contact.phone)}
															</span>
														)}
													</div>
												</div>
											</SelectItem>
										))}
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
									</SelectContent>
								</Select>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<ButtonBack>
						<Button>
							<ChevronLeftIcon /> Voltar
						</Button>
					</ButtonBack>
				</div>
			</div>
			<Card>
				<CardContent>
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
										name='modality'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='category'>
													Modalidade do Seguro:
												</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger
														id='category'
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
												<FieldLabel htmlFor='type'>Tipo do Seguro:</FieldLabel>
												<Select
													{...field}
													value={
														field.value === true
															? 'renewal'
															: field.value === false
																? 'no_renewal'
																: ''
													}
													onValueChange={(value) =>
														field.onChange(value === 'renewal')
													}
												>
													<SelectTrigger
														id='type'
														aria-invalid={fieldState.invalid}
													>
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
												<FieldLabel htmlFor='status'>Status:</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger
														id='status'
														aria-invalid={fieldState.invalid}
													>
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
												<FieldLabel htmlFor='request-date'>
													Data da Solicitação:
												</FieldLabel>
												<Input
													{...field}
													id='request-date'
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
															: typeof field.value === 'object' &&
																	isDate(field.value)
																? format(field.value, 'dd/MM/yyyy')
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
												<FieldLabel htmlFor='insured-cpf'>CPF:</FieldLabel>
												<Input
													{...field}
													id='insured-cpf'
													aria-invalid={fieldState.invalid}
													placeholder='000.000.000-00'
													onChange={({ target: { value } }) => [
														field.onChange(maskCPF(value)),
														theInsuredPartyIsTheDriver
															? setValue('driver.cpf', maskCPF(value))
															: undefined,
													]}
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
												<FieldLabel htmlFor='insured-name'>
													Nome Completo:
												</FieldLabel>
												<Input
													{...field}
													id='insured-name'
													aria-invalid={fieldState.invalid}
													placeholder='Nome Completo'
													onChange={({ target: { value } }) => [
														field.onChange(capitalizeFirstLetters(value)),
														theInsuredPartyIsTheDriver
															? setValue(
																	'driver.name',
																	capitalizeFirstLetters(value),
																)
															: undefined,
													]}
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
												<FieldLabel htmlFor='insured-birth'>
													Nascimento:
												</FieldLabel>
												<InputGroup>
													<InputGroupInput
														{...field}
														id='insured-birth'
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
														onChange={({ target: { value } }) => [
															field.onChange(
																isDateString(value)
																	? parse(value, 'dd/MM/yyyy', new Date())
																	: maskDateString(value),
															),
															theInsuredPartyIsTheDriver
																? setValue(
																		'driver.birth',
																		isDateString(value)
																			? parse(value, 'dd/MM/yyyy', new Date())
																			: maskDateString(value),
																	)
																: undefined,
														]}
														maxLength={10}
													/>
													{!!field.value && isDate(field.value) && (
														<InputGroupAddon>
															<InputGroupText>
																{differenceInYears(new Date(), field.value)}{' '}
																anos
															</InputGroupText>
														</InputGroupAddon>
													)}
												</InputGroup>
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
												<FieldLabel htmlFor='insured-phone'>
													Celular:
												</FieldLabel>
												<Input
													{...field}
													id='insured-phone'
													aria-invalid={fieldState.invalid}
													placeholder='(00) 00000-0000'
													onChange={({ target: { value } }) => [
														field.onChange(maskPhone(value)),
														theInsuredPartyIsTheDriver
															? setValue('driver.phone', maskPhone(value))
															: undefined,
													]}
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
												<FieldLabel htmlFor='insured-marital-status'>
													Estado Cívil:
												</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger
														id='insured-marital-status'
														aria-invalid={fieldState.invalid}
													>
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
												<FieldLabel htmlFor='insured-qualification-time'>
													Tempo de Habilitação:
												</FieldLabel>
												<Select
													{...field}
													value={field.value ? String(field.value) : ''}
													onValueChange={field.onChange}
												>
													<SelectTrigger
														id='insured-qualification-time'
														aria-invalid={fieldState.invalid}
													>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='0'>
															Permissão Provisória
														</SelectItem>
														<SelectSeparator />
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
												<FieldLabel htmlFor='insured-profession'>
													Profissões:
												</FieldLabel>
												<Combobox
													{...field}
													id='insured-profession'
													value={field.value || null}
													items={professions?.flatMap((e) => e.name)}
													onValueChange={field.onChange}
												>
													<ComboboxInput placeholder='Selecionar' />
													<ComboboxContent>
														<ComboboxEmpty>
															Nenhum registro encontrado.
														</ComboboxEmpty>
														<ComboboxList>
															{(item, key) => (
																<ComboboxItem key={key.toString()} value={item}>
																	{item}
																</ComboboxItem>
															)}
														</ComboboxList>
													</ComboboxContent>
												</Combobox>
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
									<Controller
										control={control}
										name='vehicle.plate'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-plate'>
													Placa:
													<sup className='text-muted-foreground ml-2'>
														( Opcional )
													</sup>
												</FieldLabel>
												<Input
													{...field}
													id='vehicle-plate'
													placeholder='AAA-0000 / AAA0A00'
													aria-invalid={fieldState.invalid}
													value={field.value || ''}
													onChange={({ target: { value } }) =>
														field.onChange(!value ? null : maskPlate(value))
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
										name='vehicle.manufacturer'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-manufacturer'>
													Fabricante:
												</FieldLabel>
												<Combobox
													{...field}
													id='vehicle-manufacturer'
													value={field.value || null}
													items={manufacturers?.flatMap((e) => e.name)}
													onValueChange={field.onChange}
												>
													<ComboboxInput placeholder='Selecionar' />
													<ComboboxContent>
														<ComboboxEmpty>
															Nenhum registro encontrado.
														</ComboboxEmpty>
														<ComboboxList>
															{(item, key) => (
																<ComboboxItem key={key.toString()} value={item}>
																	{item}
																</ComboboxItem>
															)}
														</ComboboxList>
													</ComboboxContent>
												</Combobox>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<Controller
										control={control}
										name='vehicle.model'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-model'>Modelo:</FieldLabel>
												<Input
													{...field}
													id='vehicle-model'
													aria-invalid={fieldState.invalid}
													placeholder='Modelo'
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
										name='vehicle.modelYear'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-model-year'>
													Ano do Modelo:
												</FieldLabel>
												<Input
													{...field}
													id='vehicle-model-year'
													aria-invalid={fieldState.invalid}
													placeholder='0000'
													value={String(field.value || '')}
													onChange={({ target: { value } }) =>
														field.onChange(maskNumber(value).slice(0, 4))
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
										name='vehicle.chassi'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-chassi'>
													Chassi:
													<sup className='text-muted-foreground ml-2'>
														( Opcional )
													</sup>
												</FieldLabel>
												<Input
													{...field}
													value={field.value || ''}
													id='vehicle-chassi'
													aria-invalid={fieldState.invalid}
													placeholder='Chassi'
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
									<Controller
										control={control}
										name='vehicle.usage'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-usage'>
													Uso do Veículo:
												</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger
														id='vehicle-usage'
														aria-invalid={fieldState.invalid}
													>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='leisure_and_work'>
															{translateVehicleUsage('leisure_and_work')}
														</SelectItem>
														<SelectItem value='leisure'>
															{translateVehicleUsage('leisure')}
														</SelectItem>
														<SelectItem value='client_supplier_visits'>
															{translateVehicleUsage('client_supplier_visits')}
														</SelectItem>
														<SelectItem value='app_based_transport'>
															{translateVehicleUsage('app_based_transport')}
														</SelectItem>
														<SelectItem value='public_transportation'>
															{translateVehicleUsage('public_transportation')}
														</SelectItem>
														<SelectItem value='taxi'>
															{translateVehicleUsage('taxi')}
														</SelectItem>
														<SelectItem value='delivieries'>
															{translateVehicleUsage('delivieries')}
														</SelectItem>
														<SelectItem value='tourism'>
															{translateVehicleUsage('tourism')}
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
										name='vehicle.exchange'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-exchange'>
													Câmbio:
												</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger
														id='vehicle-exchange'
														aria-invalid={fieldState.invalid}
													>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='manual'>
															{translateVehicleExchange('manual')}
														</SelectItem>
														<SelectItem value='automatic'>
															{translateVehicleExchange('automatic')}
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
										name='vehicle.overnightPostalCode'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-overnight-postal-code'>
													CEP de Pernoite:
												</FieldLabel>
												<Input
													{...field}
													id='vehicle-overnight-postal-code'
													aria-invalid={fieldState.invalid}
													placeholder='00000-000'
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
									<FieldGroup className='flex flex-row gap-x-0!'>
										<Controller
											control={control}
											name='vehicle.additional.residence.type'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-residence-type'>
														Reside Em:
													</FieldLabel>
													<Select {...field} onValueChange={field.onChange}>
														<SelectTrigger
															id='vehicle-additional-residence-type'
															aria-invalid={fieldState.invalid}
															className='rounded-r-none border-r-0'
														>
															<SelectValue placeholder='Selecionar' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='home'>
																{translateResidence('home')}
															</SelectItem>
															<SelectItem value='apartment'>
																{translateResidence('apartment')}
															</SelectItem>
															<SelectItem value='house_condominium'>
																{translateResidence('house_condominium')}
															</SelectItem>
															<SelectItem value='others'>
																{translateResidence('others')}
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
											name='vehicle.additional.residence.garage'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-residence-garage'>
														Tipo de Garagem:
													</FieldLabel>
													<Select
														{...field}
														value={field.value || ''}
														onValueChange={(value) =>
															field.onChange(value === 'clear' ? null : value)
														}
													>
														<SelectTrigger
															id='vehicle-additional-residence-garage'
															aria-invalid={fieldState.invalid}
															className='rounded-l-none'
														>
															<SelectValue placeholder='Selecionar' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='no_garage'>
																{translateGarage('no_garage')}
															</SelectItem>
															<SelectSeparator />
															<SelectItem value='automatic_gate'>
																{translateGarage('automatic_gate')}
															</SelectItem>
															<SelectItem value='manual_gate'>
																{translateGarage('manual_gate')}
															</SelectItem>
															<SelectItem value='private'>
																{translateGarage('private')}
															</SelectItem>
														</SelectContent>
													</Select>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</Field>
											)}
										/>
									</FieldGroup>
									<FieldGroup className='flex flex-row gap-x-0!'>
										<Controller
											control={control}
											name='vehicle.additional.work'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-work-garage'>
														Garagem no Trabalho:
													</FieldLabel>
													<Select
														{...field}
														value={field.value || ''}
														onValueChange={(value) =>
															field.onChange(value === 'clear' ? null : value)
														}
													>
														<SelectTrigger
															id='vehicle-additional-work-garage'
															aria-invalid={fieldState.invalid}
														>
															<SelectValue placeholder='Selecionar' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='does_not_work'>
																{translateGarageWork('does_not_work')}
															</SelectItem>
															<SelectSeparator />
															<SelectItem value='yes'>
																{translateGarageWork('yes')}
															</SelectItem>
															<SelectItem value='no'>
																{translateGarageWork('no')}
															</SelectItem>
															<SelectItem value='does_not_use'>
																{translateGarageWork('does_not_use')}
															</SelectItem>
														</SelectContent>
													</Select>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</Field>
											)}
										/>
									</FieldGroup>
									<FieldGroup className='flex flex-row gap-x-0!'>
										<Controller
											control={control}
											name='vehicle.additional.school'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-school-garage'>
														Garagem na Escola:
													</FieldLabel>
													<Select
														{...field}
														value={field.value || ''}
														onValueChange={(value) =>
															field.onChange(value === 'clear' ? null : value)
														}
													>
														<SelectTrigger
															id='vehicle-additional-school-garage'
															aria-invalid={fieldState.invalid}
														>
															<SelectValue placeholder='Selecionar' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='does_not_study'>
																{translateGarageSchool('does_not_study')}
															</SelectItem>
															<SelectSeparator />
															<SelectItem value='yes'>
																{translateGarageSchool('yes')}
															</SelectItem>
															<SelectItem value='no'>
																{translateGarageSchool('no')}
															</SelectItem>
															<SelectItem value='does_not_use'>
																{translateGarageSchool('does_not_use')}
															</SelectItem>
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
								<FieldGroup className='mt-3'>
									<FieldSet className='gap-0!'>
										<FieldLegend className='mb-1'>Mais Informações</FieldLegend>
										<FieldDescription className='text-xs'>
											Para uma cotação mais eficiente
										</FieldDescription>
									</FieldSet>
									<FieldGroup className='gap-1.5!'>
										<Controller
											control={control}
											name='vehicle.additional.armored'
											render={({ field, fieldState }) => (
												<Field
													orientation='horizontal'
													data-invalid={fieldState.invalid}
													className='gap-1.5'
												>
													<Checkbox
														{...field}
														id='vehicle-additional-armored'
														aria-invalid={fieldState.invalid}
														value={undefined}
														checked={Boolean(field.value)}
														onCheckedChange={field.onChange}
													/>
													<Label
														htmlFor='vehicle-additional-armored'
														className='font-normal text-xs text-[0.8rem] cursor-pointer'
													>
														Blindado
													</Label>
												</Field>
											)}
										/>
										<Controller
											control={control}
											name='vehicle.additional.gasKit'
											render={({ field, fieldState }) => (
												<Field
													orientation='horizontal'
													data-invalid={fieldState.invalid}
													className='gap-1.5'
												>
													<Checkbox
														{...field}
														id='vehicle-additional-gas-kit'
														aria-invalid={fieldState.invalid}
														value={undefined}
														checked={Boolean(field.value)}
														onCheckedChange={field.onChange}
													/>
													<Label
														htmlFor='vehicle-additional-gas-kit'
														className='font-normal text-xs text-[0.8rem] cursor-pointer'
													>
														Kit Gás
													</Label>
												</Field>
											)}
										/>
										<Controller
											control={control}
											name='vehicle.additional.theInsuredIsTheOwner'
											render={({ field, fieldState }) => (
												<Field
													orientation='horizontal'
													data-invalid={fieldState.invalid}
													className='gap-1.5'
												>
													<Checkbox
														{...field}
														id='vehicle-additional-the-insured-is-the-owner'
														aria-invalid={fieldState.invalid}
														value={undefined}
														checked={Boolean(field.value)}
														onCheckedChange={field.onChange}
													/>
													<Label
														htmlFor='vehicle-additional-the-insured-is-the-owner'
														className='font-normal text-xs text-[0.8rem] cursor-pointer'
													>
														Segurado é o proprietário do veículo
													</Label>
												</Field>
											)}
										/>
										<Controller
											control={control}
											name='vehicle.additional.funded'
											render={({ field, fieldState }) => (
												<Field
													orientation='horizontal'
													data-invalid={fieldState.invalid}
													className='gap-1.5'
												>
													<Checkbox
														{...field}
														id='vehicle-additional-funded'
														aria-invalid={fieldState.invalid}
														value={undefined}
														checked={Boolean(field.value)}
														onCheckedChange={field.onChange}
													/>
													<Label
														htmlFor='vehicle-additional-funded'
														className='font-normal text-xs text-[0.8rem] cursor-pointer'
													>
														Financiado
													</Label>
												</Field>
											)}
										/>
										<Controller
											control={control}
											name='vehicle.additional.driversUnder26'
											render={({ field, fieldState }) => (
												<Field
													orientation='horizontal'
													data-invalid={fieldState.invalid}
													className='gap-1.5'
												>
													<Checkbox
														{...field}
														id='vehicle-additional-drivers-under-26'
														aria-invalid={fieldState.invalid}
														value={undefined}
														checked={Boolean(field.value)}
														onCheckedChange={field.onChange}
													/>
													<Label
														htmlFor='vehicle-additional-drivers-under-26'
														className='font-normal text-xs text-[0.8rem] cursor-pointer'
													>
														Pessoas entre 18 a 26 anos utilizam o veículo
													</Label>
												</Field>
											)}
										/>
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
											Principal Condutor |{' '}
											<div className='flex flex-row items-center justify-start gap-x-2 pr-3'>
												<Checkbox
													id='the-same-driver'
													value={undefined}
													checked={theInsuredPartyIsTheDriver}
													onCheckedChange={(value) => [
														setTheInsuredPartyIsTheDriver(Boolean(value)),
														Boolean(value) === true
															? [
																	setValue('driver', {
																		cpf: getValues('insured.cpf'),
																		name: getValues('insured.name'),
																		phone: getValues('insured.phone'),
																		birth: getValues('insured.birth'),
																	}),
																	clearErrors('driver'),
																]
															: undefined,
													]}
												/>
												<Label
													htmlFor='the-same-driver'
													className='font-normal text-xs'
												>
													O segurado é o condutor
												</Label>
											</div>
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='grid grid-cols-4'>
									<Controller
										control={control}
										name='driver.cpf'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='driver-cpf'>CPF:</FieldLabel>
												<Input
													{...field}
													id='driver-cpf'
													aria-invalid={fieldState.invalid}
													disabled={theInsuredPartyIsTheDriver}
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
										name='driver.name'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='driver-name'>
													Nome Completo:
												</FieldLabel>
												<Input
													{...field}
													id='driver-name'
													aria-invalid={fieldState.invalid}
													disabled={theInsuredPartyIsTheDriver}
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
										name='driver.birth'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='driver-birth'>
													Nascimento:
												</FieldLabel>
												<InputGroup>
													<InputGroupInput
														{...field}
														id='driver-birth'
														aria-invalid={fieldState.invalid}
														disabled={theInsuredPartyIsTheDriver}
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
																: typeof field.value === 'object' &&
																		isDate(field.value)
																	? format(field.value, 'dd/MM/yyyy')
																	: ''
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
													{!!field.value && isDate(field.value) && (
														<InputGroupAddon>
															<InputGroupText>
																{differenceInYears(new Date(), field.value)}{' '}
																anos
															</InputGroupText>
														</InputGroupAddon>
													)}
												</InputGroup>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<Controller
										control={control}
										name='driver.phone'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='driver-phone'>Celular:</FieldLabel>
												<Input
													{...field}
													id='driver-phone'
													aria-invalid={fieldState.invalid}
													disabled={theInsuredPartyIsTheDriver}
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
				disabled={isPending || !isDirty}
			>
				<SaveIcon /> Salvar Registro
			</Button>
		</Fragment>
	);
}

export { FormQuoteRegister };
