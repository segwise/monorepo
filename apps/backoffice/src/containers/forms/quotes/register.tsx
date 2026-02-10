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
	translateMaritalStatus,
	translateQuoteStatus,
	translateResidence,
	translateVehicleExchange,
	translateVehicleUsage,
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
import { useVehiclesManufacturers } from '@/libraries/hooks/vehicles/use-vehicle-manufacturers';

function FormQuoteRegister() {
	const { data: producers } = useProducers({
		simple: true,
	});

	const { data: professions } = useProfessions({
		simple: true,
	});

	const { data: manufacturers } = useVehiclesManufacturers();

	const {
		control,
		handleSubmit,
		setValue,
		watch,
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
												<FieldLabel htmlFor='category'>
													Categoria do Seguro:
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
																: undefined
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
												<FieldLabel htmlFor='insured-name'>
													Nome Completo:
												</FieldLabel>
												<Input
													{...field}
													id='insured-name'
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
												<FieldLabel htmlFor='insured-birth'>
													Nascimento:
												</FieldLabel>
												<Input
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
												<FieldLabel htmlFor='insured-phone'>
													Celular:
												</FieldLabel>
												<Input
													{...field}
													id='insured-phone'
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
													Profissão:
													<sup className='text-muted-foreground ml-2'>
														( Opcional )
													</sup>
												</FieldLabel>
												<Combobox
													{...field}
													items={professions}
													itemToStringValue={(item) =>
														// @ts-expect-error
														item.name
													}
													itemToStringLabel={(item) =>
														// @ts-expect-error
														item.name
													}
												>
													<ComboboxInput placeholder='Selecionar' />
													<ComboboxContent
														align='end'
														side='bottom'
														alignOffset={-22}
													>
														<ComboboxEmpty>
															Nenhum registro encontrado.
														</ComboboxEmpty>
														<ComboboxList>
															{(item) => (
																<ComboboxItem key={item.code} value={item}>
																	{item.name}
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
													items={manufacturers}
													itemToStringValue={(item) =>
														// @ts-expect-error
														item.name
													}
													itemToStringLabel={(item) =>
														// @ts-expect-error
														item.name
													}
												>
													<ComboboxInput placeholder='Selecionar' />
													<ComboboxContent
														align='end'
														side='bottom'
														alignOffset={-22}
													>
														<ComboboxEmpty>
															Nenhum registro encontrado.
														</ComboboxEmpty>
														<ComboboxList>
															{(item) => (
																<ComboboxItem key={item.name} value={item}>
																	{item.name}
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
										name='vehicle.use'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-use'>
													Uso do Veículo:
												</FieldLabel>
												<Select {...field} onValueChange={field.onChange}>
													<SelectTrigger
														id='vehicle-use'
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
											name='vehicle.additional.work.active'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-work-active'>
														Trabalho:
													</FieldLabel>
													<Select
														{...field}
														value={
															field.value === true
																? 'yes'
																: field.value === false
																	? 'no'
																	: undefined
														}
														onValueChange={(value) => [
															field.onChange(
																value === 'yes'
																	? true
																	: value === 'no'
																		? false
																		: null,
															),
															value === 'no'
																? setValue(
																		'vehicle.additional.work.garage',
																		null,
																	)
																: undefined,
														]}
													>
														<SelectTrigger
															id='vehicle-additional-work-active'
															aria-invalid={fieldState.invalid}
															className='rounded-r-none border-r-0'
														>
															<SelectValue placeholder='Selecionar' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='yes'>Sim</SelectItem>
															<SelectItem value='no'>Não</SelectItem>
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
											name='vehicle.additional.work.garage'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-work-garage'>
														Tipo de Garagem:
													</FieldLabel>
													<Select
														{...field}
														value={field.value || ''}
														onValueChange={(value) =>
															field.onChange(value === 'clear' ? null : value)
														}
														disabled={!watch('vehicle.additional.work.active')}
													>
														<SelectTrigger
															id='vehicle-additional-work-garage'
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
											name='vehicle.additional.school.active'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-school-active'>
														Estuda:
													</FieldLabel>
													<Select
														{...field}
														value={
															field.value === true
																? 'yes'
																: field.value === false
																	? 'no'
																	: undefined
														}
														onValueChange={(value) => [
															field.onChange(
																value === 'yes'
																	? true
																	: value === 'no'
																		? false
																		: null,
															),
															value === 'no'
																? setValue(
																		'vehicle.additional.school.garage',
																		null,
																	)
																: undefined,
														]}
													>
														<SelectTrigger
															id='vehicle-additional-school-active'
															aria-invalid={fieldState.invalid}
															className='rounded-r-none border-r-0'
														>
															<SelectValue placeholder='Selecionar' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='yes'>Sim</SelectItem>
															<SelectItem value='no'>Não</SelectItem>
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
											name='vehicle.additional.school.garage'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='vehicle-additional-school-garage'>
														Tipo de Garagem:
													</FieldLabel>
													<Select
														{...field}
														value={field.value || ''}
														onValueChange={(value) =>
															field.onChange(value === 'clear' ? null : value)
														}
														disabled={
															!watch('vehicle.additional.school.active')
														}
													>
														<SelectTrigger
															id='vehicle-additional-school-garage'
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
				type='button'
				onClick={handleSubmit(onSubmit)}
				className='w-full'
				disabled={!isDirty}
			>
				<SaveIcon /> Salvar Registro
			</Button>
		</Fragment>
	);
}

export { FormQuoteRegister };
