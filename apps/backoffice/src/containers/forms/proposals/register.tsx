'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	maskCNPJ,
	maskCPF,
	maskDateString,
	maskNumber,
	maskPhone,
	maskPlate,
	maskPostalCode,
} from '@segwise/core/masks';
import {
	SchemaModality,
	SchemaPlate,
	SchemaSafeCommission,
	SchemaSafeRegister,
} from '@segwise/core/schemas';
import {
	translateModality,
	translateProfession,
	translateSafeCommissionType,
	translateVehicleUsage,
} from '@segwise/core/translate';
import type { QuoteRegister, SafeRegister } from '@segwise/core/types';
import {
	calculatePercentageOfValue,
	capitalizeFirstLetters,
	getNumericValue,
	professions,
} from '@segwise/core/utils';
import { isCNPJ, isCPF, isDateString, isPlate } from '@segwise/core/valids';
import { useMutation } from '@tanstack/react-query';
import {
	addYears,
	differenceInYears,
	endOfToday,
	format,
	isValid,
	parse,
	startOfDay,
	startOfToday,
	subYears,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
	BikeIcon,
	BotIcon,
	BrainIcon,
	Building2Icon,
	CalendarIcon,
	CarIcon,
	ChevronLeftIcon,
	CircleDollarSignIcon,
	ClipboardIcon,
	FileCogIcon,
	FileTextIcon,
	Loader2Icon,
	MoreVerticalIcon,
	SaveIcon,
	SearchIcon,
	TruckIcon,
	User2Icon,
	UserCircle2Icon,
	XCircleIcon,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { cloneElement, Fragment, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { withMask } from 'use-mask-input';
import z from 'zod';
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
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
import { api } from '@/libraries/api';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';
import { useProducersSimpleFull } from '@/libraries/hooks/producers/use-producers';
import { useQuotesByPlate } from '@/libraries/hooks/quotes/use-quotes-by-plate';
import { useSafesById } from '@/libraries/hooks/safes/use-safes';
import { useSafesRegister } from '@/libraries/hooks/safes/use-safes-register';
import { useSafesUpdate } from '@/libraries/hooks/safes/use-safes-update';
import { useCpfOrCnpj } from '@/libraries/hooks/use-cpf-or-cnpj';
import { useVehiclesManufacturers } from '@/libraries/hooks/vehicles/use-vehicles-manufacturers';
import { useVehiclesPlate } from '@/libraries/hooks/vehicles/use-vehicles-plate';

const ENTER_NAVIGATION_MAP: Record<string, string> = {
	'vehicle-plate': 'vehicle-usage',
	'insured-cpf': 'vehicle-plate',
	'insured-birth': 'vehicle-plate',
};

const OPEN_ON_FOCUS_IDS = new Set(['vehicle-usage']);

function FormProposalRegister({ id }: { id?: string }) {
	const { push } = useRouter();

	const searchParams = useSearchParams();

	const [readerPDF, setReaderPDF] = useState<boolean>(false);

	const renewal =
		(searchParams.get('renewal') && searchParams.get('renewal') === 'true') ||
		false;

	const { data: producers } = useProducersSimpleFull();
	const { data: insuranceCompanies } = useInsuranceCompaniesSimple();
	const { data: manufacturers, refetch: refetchManufacturers } =
		useVehiclesManufacturers();

	const [theInsuredPartyIsTheDriver, setTheInsuredPartyIsTheDriver] =
		useState<boolean>(false);

	const [openDocumentDialog, setOpenDocumentDialog] = useState(false);

	const { data: safe } = useSafesById(id);

	const { mutate, isPending: isMutation } = useSafesRegister();
	const { mutate: update, isPending: isUpdation } = useSafesUpdate(id);

	const {
		control,
		handleSubmit,
		setValue,
		clearErrors,
		getValues,
		setFocus,
		reset,
		watch,
		formState: { isDirty, isValid: isValidForm },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaSafeRegister),
		defaultValues: {
			insuranceCompany: safe?.insuranceCompany ?? '',
			status: safe?.status || 'active',
			producer: safe?.producer ?? null,
			modality: safe?.modality || SchemaModality.enum.vehicle,
			renewal,
			requestedAt: safe
				? startOfDay(
						toZonedTime(
							renewal
								? (safe.expirationAt as string)
								: subYears(safe.expirationAt, 1),
							'UTC',
						),
					)
				: null,
			insured: {
				registration: safe?.insured.registration
					? isCPF(safe.insured.registration)
						? maskCPF(safe.insured.registration)
						: maskCNPJ(safe.insured.registration)
					: '',
				name: capitalizeFirstLetters(safe?.insured.name ?? ''),
				birth: safe?.insured.birth || '',
				phone: safe?.insured.contact.phone
					? maskPhone(safe.insured.contact.phone)
					: '',
				profession: safe?.insured.profession ?? null,
			},
			vehicle: {
				plate: safe?.vehicle.plate ? maskPlate(safe.vehicle.plate) : null,
				model: capitalizeFirstLetters(safe?.vehicle.model ?? ''),
				manufacturer: safe?.vehicle.plate
					? (safe?.vehicle.manufacturer ?? null)
					: null,
				modelYear: safe?.vehicle.modelYear ?? '',
				usage: safe?.vehicle.usage ?? undefined,
				overnightPostalCode: safe?.vehicle.overnightPostalCode
					? maskPostalCode(safe.vehicle.overnightPostalCode)
					: '',
			},
			driver: {
				registration:
					(safe?.vehicle.driver.registration ?? safe?.insured.registration)
						? maskCPF(
								safe.vehicle.driver.registration ?? safe?.insured.registration,
							)
						: '',
				name: capitalizeFirstLetters(
					safe?.vehicle.driver.name ?? safe?.insured.name ?? '',
				),
				birth: safe?.vehicle.driver.birth ?? safe?.insured.birth ?? '',
			},
			...(safe?.commission &&
				!renewal && {
					award: safe.commission.award.toString().replace('.', ','),
					commission: safe.commission.percentage,
					franchise: safe.commission.franchise.toString().replace('.', ','),
					installments: safe.commission.installments,
				}),
			commissions: null,
		},
		...(safe && {
			values: {
				insuranceCompany: safe.insuranceCompany,
				status: safe.status,
				producer: safe.producer,
				modality: safe.modality,
				renewal,
				requestedAt: startOfDay(
					toZonedTime(
						renewal
							? (safe.expirationAt as string)
							: subYears(safe.expirationAt, 1),
						'UTC',
					),
				),
				insured: {
					registration: isCPF(safe.insured.registration)
						? maskCPF(safe.insured.registration)
						: maskCNPJ(safe.insured.registration),
					name: capitalizeFirstLetters(safe.insured.name),
					birth: safe.insured.birth,
					phone: maskPhone(safe.insured.contact.phone),
					profession: safe.insured.profession,
				},
				vehicle: {
					plate: safe.vehicle.plate ? maskPlate(safe.vehicle.plate) : null,
					manufacturer: safe.vehicle.plate
						? (safe.vehicle.manufacturer ?? null)
						: null,
					model: capitalizeFirstLetters(safe.vehicle.model),
					modelYear: safe.vehicle.modelYear,
					usage: safe.vehicle.usage,
					overnightPostalCode: maskPostalCode(safe.vehicle.overnightPostalCode),
				},
				driver: {
					registration: isCNPJ(
						safe.vehicle.driver.registration ?? safe.insured.registration,
					)
						? maskCNPJ(
								safe.vehicle.driver.registration ?? safe.insured.registration,
							)
						: maskCPF(
								safe.vehicle.driver.registration ?? safe.insured.registration,
							),
					name: capitalizeFirstLetters(
						safe?.vehicle.driver.name ?? safe.insured.name,
					),
					birth: safe?.vehicle.driver.birth ?? safe.insured.birth,
				},
				receivables: {
					award: !renewal
						? safe.commission.award.toString().replace('.', ',')
						: 0,
					commission: !renewal ? safe.commission.percentage : 0,
					franchise: !renewal
						? safe.commission.franchise.toString().replace('.', ',')
						: 0,
					installments: !renewal ? safe.commission.installments : 0,
				},
				commissions: null,
			},
		}),
	});

	const plate = watch('vehicle.plate');

	const { data: vehicleSearch, isPending: isPendingVehicleSearch } =
		useVehiclesPlate(plate || '');

	const existsProducer = !!watch('producer');

	const installments = Number(watch('receivables.installments') || 0);
	const award =
		getNumericValue(
			// @ts-expect-error
			watch('receivables.award'),
		) || 0;
	const commissionPercentage = Number(watch('receivables.commission') || 0);
	const commissionAmount = calculatePercentageOfValue(
		award,
		commissionPercentage,
	);

	const installmentsProducer = Number(watch('commissions.installments') || 0);
	const commissionPercentageProducer = Number(
		watch('commissions.percentage') || 0,
	);
	const commissionAmountProducer = calculatePercentageOfValue(
		watch('commissions.type') === 'by_the_brokerage_commission'
			? commissionAmount
			: watch('commissions.type') === 'by_the_net_premium'
				? award
				: 0,
		commissionPercentageProducer,
	);

	const commissionGross = commissionAmount;
	const commissionNet = commissionAmount - commissionAmountProducer;

	function onChangeResponseQuotesSearch(props: QuoteRegister) {
		if (props.producer) {
			setValue('producer', props.producer);
		}

		if (props.insuranceCompany) {
			setValue('insuranceCompany', props.insuranceCompany);
		}

		setValue('modality', props.modality);

		if (props.insured.cpf) {
			setValue(
				'insured.registration',
				isCPF(props.insured.cpf)
					? maskCPF(props.insured.cpf)
					: maskCNPJ(props.insured.cpf),
			);
		}

		setValue('insured.name', capitalizeFirstLetters(props.insured.name));
		setValue('insured.birth', props.insured.birth);
		setValue('insured.phone', maskPhone(props.insured.phone.slice(2)));

		if (props.requestedAt) {
			setReaderPDF(true);
			setValue('requestedAt', props.requestedAt);
		}

		setValue(
			'vehicle.plate',
			props.vehicle?.plate ? maskPlate(props.vehicle.plate) : null,
		);

		const manufacturer = props.vehicle?.manufacturer
			? manufacturers?.find(
					(e) =>
						e.name.toLowerCase() === props.vehicle?.manufacturer.toLowerCase(),
				)?.id
			: null;

		if (manufacturer) {
			setValue('vehicle.manufacturer', manufacturer);
		}

		setValue(
			'vehicle.model',
			capitalizeFirstLetters(props.vehicle?.model as string),
		);
		setValue('vehicle.modelYear', props.vehicle?.modelYear);
		setValue('vehicle.chassi', props.vehicle?.chassi);
		setValue('vehicle.usage', props.vehicle?.usage);
		setValue('vehicle.exchange', props.vehicle?.exchange);
		setValue(
			'vehicle.overnightPostalCode',
			maskPostalCode(props.vehicle?.overnightPostalCode as string),
		);

		if (props.driver.cpf) {
			setValue(
				'driver.registration',
				isCPF(props.driver.cpf)
					? maskCPF(props.driver.cpf)
					: maskCNPJ(props.driver.cpf),
			);
		}

		if (props.driver.name) {
			setValue('driver.name', capitalizeFirstLetters(props.driver.name));
		}

		if (props.driver.cpf) {
			setValue('driver.birth', props.driver.birth);
		}

		// @ts-expect-error
		if (props.receivables) {
			// @ts-expect-error
			if (props.receivables.award) {
				setValue(
					'receivables.award',
					// @ts-expect-error
					props.receivables.award
						.toString()
						.replace('.', ','),
				);
			}

			// @ts-expect-error
			if (props.receivables.franchise) {
				setValue(
					'receivables.franchise',
					// @ts-expect-error
					props.receivables.franchise
						.toString()
						.replace('.', ','),
				);
			}

			// @ts-expect-error
			if (props.receivables.installments) {
				// @ts-expect-error
				setValue('receivables.installments', props.receivables.installments);
			}
		}

		if (
			props.driver &&
			maskNumber(props.driver.cpf) === maskNumber(props.insured.cpf)
		) {
			setTheInsuredPartyIsTheDriver(true);
		}
	}

	function onSubmit(props: SafeRegister) {
		(!id ? mutate : !!id && renewal ? mutate : update)(props, {
			onSuccess(data) {
				toast.success(
					(
						data.message ||
						`${!id ? 'Cadastrado' : !!id && renewal ? 'Cadastrado' : 'Atualizado'} com sucesso`
					).toUpperCase(),
				);

				setTheInsuredPartyIsTheDriver(false);
				// @ts-expect-error
				reset({
					producer: null,
					renewal: null,
					status: 'active',
					modality: 'vehicle',
					insuranceCompany: '',
					requestedAt: startOfToday(),
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
						},
						chassi: null,
					},
					driver: {
						cpf: '',
						name: '',
						birth: '',
					},
					commissions: {
						type: '',
						typeOfInterest: '',
					},
				});

				setTimeout(() => {
					clearErrors();
				}, 100);

				push('/proposals');
			},
			onError(error) {
				toast.error(error.message || 'Falha ao registrar proposta');
			},
		});
	}

	const cpfOrCnpj = watch('insured.registration');
	const cpfOrCnpjDriver = watch('driver.registration');

	const { data: cpfOrCnpjSearch, isPending: isPendingCpfOrCnpjSearch } =
		useCpfOrCnpj(cpfOrCnpj);
	const {
		data: cpfOrCnpjSearchDriver,
		isPending: isPendingCpfOrCnpjSearchDriver,
	} = useCpfOrCnpj(!theInsuredPartyIsTheDriver ? cpfOrCnpjDriver : '');

	function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
		if (e.key !== 'Enter') {
			return;
		}

		const target = e.target as HTMLElement;

		if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
			return;
		}

		const form = e.currentTarget;

		const targetId = target.id;
		const overrideId = ENTER_NAVIGATION_MAP[targetId];

		if (overrideId) {
			e.preventDefault();
			e.stopPropagation();

			const overrideEl = form.querySelector<HTMLElement>(`#${overrideId}`);

			overrideEl?.focus();

			if (OPEN_ON_FOCUS_IDS.has(overrideId)) {
				requestAnimationFrame(() => {
					overrideEl?.dispatchEvent(
						new KeyboardEvent('keydown', {
							key: 'Enter',
							code: 'Enter',
							bubbles: true,
						}),
					);
				});
			}

			return;
		}

		const focusable = Array.from(
			form.querySelectorAll<HTMLElement>(
				'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
			),
		).filter((el) => {
			return el.offsetParent !== null;
		});

		const currentIndex = focusable.indexOf(target);

		const isLastField = currentIndex === focusable.length - 1;

		if (isLastField && isValidForm) {
			return;
		}

		e.preventDefault();

		if (currentIndex !== -1 && currentIndex < focusable.length - 1) {
			focusable[currentIndex + 1]?.focus();
		}
	}

	useEffect(() => {
		if (cpfOrCnpjSearch) {
			const name = capitalizeFirstLetters(cpfOrCnpjSearch.name);
			const birth = cpfOrCnpjSearch.birth;

			setValue('insured.name', name);
			setValue('insured.birth', birth);

			clearErrors('insured.name');
			clearErrors('insured.birth');

			if (theInsuredPartyIsTheDriver) {
				setValue('driver.name', name);
				setValue('driver.birth', birth);

				clearErrors('driver.name');
				clearErrors('driver.birth');
			}
		}
	}, [cpfOrCnpjSearch, theInsuredPartyIsTheDriver, setValue, clearErrors]);

	useEffect(() => {
		if (cpfOrCnpjSearchDriver && !theInsuredPartyIsTheDriver) {
			const name = capitalizeFirstLetters(cpfOrCnpjSearchDriver.name);
			const birth = cpfOrCnpjSearchDriver.birth;

			setValue('driver.name', name);
			setValue('driver.birth', birth);

			clearErrors('driver.name');
			clearErrors('driver.birth');
		}
	}, [
		cpfOrCnpjSearchDriver,
		theInsuredPartyIsTheDriver,
		setValue,
		clearErrors,
	]);

	useEffect(() => {
		if (vehicleSearch) {
			refetchManufacturers();

			setValue('vehicle.manufacturer', vehicleSearch.manufacturer.id);
			clearErrors('vehicle.manufacturer');

			setValue('vehicle.model', capitalizeFirstLetters(vehicleSearch.model));
			clearErrors('vehicle.model');

			setValue('vehicle.modelYear', vehicleSearch.modelYear);
			clearErrors('vehicle.modelYear');

			setValue('vehicle.chassi', vehicleSearch?.chassi || null);
			clearErrors('vehicle.chassi');

			setValue('vehicle.exchange', vehicleSearch.exchange || null);

			setTimeout(() => {
				clearErrors('vehicle.exchange');
			}, 100);
		}
	}, [vehicleSearch, setValue, clearErrors, refetchManufacturers]);

	useEffect(() => {
		if (safe) {
			if (
				safe.vehicle.driver.registration &&
				maskNumber(safe.vehicle.driver.registration) ===
					maskNumber(safe.insured.registration)
			) {
				setTheInsuredPartyIsTheDriver(true);
			} else if (!safe.vehicle.driver.registration) {
				setTheInsuredPartyIsTheDriver(true);
			}
		}
	}, [safe]);

	return (
		<Fragment>
			<DialogGetDocument
				open={openDocumentDialog}
				onOpenChange={setOpenDocumentDialog}
				onChange={onChangeResponseQuotesSearch}
			/>
			<div className='flex flex-row items-center justify-between **:gap-x-2'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button>
							<MoreVerticalIcon />
							Preenchimento Automático
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='start' side='bottom'>
						<DialogGetPlate onChange={onChangeResponseQuotesSearch}>
							<DropdownMenuItem>
								<BotIcon /> Via Cotação
							</DropdownMenuItem>
						</DialogGetPlate>
						<DropdownMenuItem onSelect={() => setOpenDocumentDialog(true)}>
							<FileCogIcon /> Via Proposta ( PDF )
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<div className='flex flex-row items-center justify-end'>
					<ButtonBack>
						<Button>
							<ChevronLeftIcon /> Voltar
						</Button>
					</ButtonBack>
				</div>
			</div>
			<Card>
				<CardContent>
					<form
						id='form-proposal-register'
						onSubmit={handleSubmit(onSubmit)}
						onKeyDown={handleFormKeyDown}
					>
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
													>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														{SchemaModality.options
															.filter(
																(e) =>
																	e === 'vehicle' ||
																	e === 'motorcycle' ||
																	e === 'truck',
															)
															.map((item) => (
																<SelectItem value={item} key={item}>
																	<div className='flex flex-row items-center justify-start gap-x-2'>
																		{item === 'vehicle' && <CarIcon />}
																		{item === 'motorcycle' && <BikeIcon />}
																		{item === 'truck' && <TruckIcon />}
																		{/* {item === 'health' && <HeartIcon />}
																	{item === 'residence' && <HomeIcon />}
																	{item === 'business' && <BuildingIcon />}
																	{item === 'condominium' && <BuildingIcon />}
																	{item === 'travel' && <PlaneIcon />}
																	{item === 'professional' && <UserIcon />}
																	{item === 'construction' && <BuildingIcon />} */}
																		{capitalizeFirstLetters(
																			translateModality(item)
																				.toLowerCase()
																				.replace('seguro', '')
																				.trim(),
																		)}
																	</div>
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
										name='insuranceCompany'
										render={({ field: { value, onChange }, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='insurance-company'>
													Seguradora:
												</FieldLabel>
												<Combobox
													id='insurance-company'
													value={
														value
															? {
																	value: value,
																	label: capitalizeFirstLetters(
																		insuranceCompanies?.find(
																			(e) => e.id === value,
																		)?.name ?? '',
																	).replace('S/a', 'S/A'),
																}
															: null
													}
													items={insuranceCompanies || []}
													onValueChange={(value) => {
														// @ts-expect-error
														onChange(value.value);

														if (!getValues('requestedAt')) {
															const overrideEl =
																document.querySelector<HTMLElement>(
																	'#start-validity',
																);

															requestAnimationFrame(() => {
																overrideEl?.dispatchEvent(
																	new KeyboardEvent('keydown', {
																		key: 'Enter',
																		code: 'Enter',
																		bubbles: true,
																	}),
																);
															});

															setTimeout(() => {
																overrideEl?.focus();
															}, 100);
														}
													}}
												>
													<ComboboxInput
														id='insurance-company'
														placeholder='Selecionar'
													/>
													<ComboboxContent>
														<ComboboxEmpty>
															Nenhum registro encontrado!
														</ComboboxEmpty>
														<ComboboxList>
															{(item) => (
																<ComboboxItem
																	key={item.id}
																	value={{
																		value: item.id,
																		label: capitalizeFirstLetters(
																			item.name,
																		).replace('S/a', 'S/A'),
																	}}
																>
																	<div className='flex flex-row items-center justify-start gap-x-2'>
																		<Avatar className='size-6'>
																			<AvatarImage
																				src={item.icon || placeholder.company}
																				width={512}
																				height={512}
																				alt={capitalizeFirstLetters(
																					item.name,
																				).replace('S/a', 'S/A')}
																			/>
																			<AvatarFallback>
																				{item.name.toUpperCase().slice(0, 2)}
																			</AvatarFallback>
																		</Avatar>
																		{capitalizeFirstLetters(item.name).replace(
																			'S/a',
																			'S/A',
																		)}
																	</div>
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
										name='requestedAt'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='start-validity'>
													Início da Vigência:
												</FieldLabel>
												<DatePickerInput
													{...field}
													key={
														safe || readerPDF
															? field.value?.toString()
															: undefined
													}
													id='start-validity'
													value={
														field.value instanceof Date ? field.value : null
													}
													onChange={(value) => {
														field.onChange(value);

														if (!getValues('insured.phone')) {
															setFocus('insured.phone');
														}
													}}
													disabled={field.disabled}
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
										name='requestedAt'
										render={({ field, fieldState }) => (
											<Field>
												<FieldLabel htmlFor='end-validity'>
													Final da Vigência:
												</FieldLabel>
												<InputGroup>
													<InputGroupInput
														{...field}
														id='end-validity'
														readOnly
														placeholder='00/00/0000'
														value={
															field.value instanceof Date
																? format(addYears(field.value, 1), 'dd/MM/yyyy')
																: ''
														}
														onChange={undefined}
														maxLength={10}
													/>
													<InputGroupButton
														variant='ghost'
														size='icon'
														className='absolute right-1 h-7 w-7 text-muted-foreground pointer-events-none'
													>
														<CalendarIcon className='h-4 w-4' />
													</InputGroupButton>
												</InputGroup>
												{fieldState.invalid && (
													<FieldError
														errors={[fieldState.error]}
														className='opacity-0 invisible'
													/>
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
										name='insured.registration'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='insured-cpf'>CPF/CNPJ:</FieldLabel>
												<div className='flex flex-row items-center justify-between'>
													<Input
														{...field}
														id='insured-cpf'
														aria-invalid={fieldState.invalid}
														placeholder='000.000.000-00'
														onChange={({ target: { value } }) => {
															const valueMask =
																value.length >= 11
																	? isCPF(value)
																		? maskCPF(value)
																		: maskCNPJ(value)
																	: value;

															field.onChange(valueMask);

															if (theInsuredPartyIsTheDriver) {
																setValue('driver.registration', valueMask);
															}

															if (value.length === 0) {
																setValue('insured.name', '');
																setValue('insured.birth', '');

																if (theInsuredPartyIsTheDriver) {
																	setValue('driver.name', '');
																	setValue('driver.birth', '');
																}
															}
														}}
													/>
													{field.value &&
														isPlate(field.value) &&
														isPendingCpfOrCnpjSearch && (
															<Loader2Icon className='animate-spin size-4 text-muted-foreground ml-3' />
														)}
												</div>
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
													{isCNPJ(watch('insured.registration'))
														? 'Data de Abertura'
														: 'Nascimento:'}
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
																: field.value instanceof Date
																	? format(field.value, 'dd/MM/yyyy')
																	: ''
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
													{isValid(
														typeof field.value === 'string'
															? parse(field.value, 'dd/MM/yyyy', new Date())
															: (field.value as Date),
													) &&
														differenceInYears(
															new Date(),
															typeof field.value === 'string'
																? parse(field.value, 'dd/MM/yyyy', new Date())
																: (field.value as Date),
														) <= 120 &&
														differenceInYears(
															new Date(),
															typeof field.value === 'string'
																? parse(field.value, 'dd/MM/yyyy', new Date())
																: (field.value as Date),
														) >= 18 && (
															<InputGroupAddon>
																<InputGroupText>
																	{differenceInYears(
																		new Date(),
																		typeof field.value === 'string'
																			? parse(
																					field.value,
																					'dd/MM/yyyy',
																					new Date(),
																				)
																			: (field.value as Date),
																	)}{' '}
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
										name='insured.profession'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='insured-profession'>
													Profissão:
													<sup className='text-muted-foreground ml-2'>
														( Opcional )
													</sup>
												</FieldLabel>
												<Select
													{...field}
													value={field.value ?? ''}
													onValueChange={(value) =>
														field.onChange(value === 'null' ? null : value)
													}
												>
													<SelectTrigger
														id='insured-profession'
														aria-invalid={fieldState.invalid}
													>
														<SelectValue placeholder='Selecionar' />
													</SelectTrigger>
													<SelectContent>
														{field.value && (
															<Fragment>
																<SelectItem value='null'>Nenhuma</SelectItem>
																<SelectSeparator />
															</Fragment>
														)}
														{professions.map((item) => (
															<SelectItem key={item} value={item}>
																{translateProfession(item)}
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
												<div className='flex flex-row items-center justify-between'>
													<Input
														{...field}
														id='vehicle-plate'
														placeholder='AAA-0000 / AAA0A00'
														aria-invalid={fieldState.invalid}
														value={field.value || ''}
														onChange={({ target: { value } }) => {
															field.onChange(!value ? null : maskPlate(value));

															if (!isPlate(value)) {
																if (getValues('vehicle.manufacturer')) {
																	setValue('vehicle.manufacturer', null);
																}

																if (getValues('vehicle.model')) {
																	// @ts-expect-error
																	setValue('vehicle.model', null);
																}

																if (getValues('vehicle.modelYear')) {
																	setValue('vehicle.modelYear', null);
																}

																if (getValues('vehicle.chassi')) {
																	setValue('vehicle.chassi', null);
																}

																if (getValues('vehicle.exchange')) {
																	setValue('vehicle.exchange', null);

																	setTimeout(() => {
																		clearErrors('vehicle.exchange');
																	}, 100);
																}
															}
														}}
													/>
													{field.value &&
														isPlate(field.value) &&
														isPendingVehicleSearch && (
															<Loader2Icon className='animate-spin size-4 text-muted-foreground ml-3' />
														)}
												</div>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									{/* <Controller
										control={control}
										name='vehicle.manufacturer'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel
													htmlFor='vehicle-manufacturer'
													className={cn(
														'',
														!!plate?.length && 'pointer-events-none',
													)}
												>
													Fabricante:
												</FieldLabel>
												<Combobox
													{...field}
													id='vehicle-manufacturer'
													value={
														manufacturers?.find((e) => e.id === field.value) ||
														null
													}
													items={manufacturers}
													onValueChange={field.onChange}
													itemToStringLabel={(item) =>
														item?.name
															? capitalizeFirstLetters(item.name.toUpperCase())
															: item.name
													}
													itemToStringValue={(item) => item.id}
												>
													<ComboboxInput
														aria-invalid={fieldState.invalid}
														placeholder='Selecionar'
														className={cn(
															'',
															(!!plate?.length ||
																(isPlate(plate || '') &&
																	!isPendingVehicleSearch)) &&
																'pointer-events-none',
														)}
													/>
													<ComboboxContent>
														<ComboboxEmpty>
															Nenhum registro encontrado.
														</ComboboxEmpty>
														<ComboboxList>
															{(item: VehicleManufacturer) => (
																<ComboboxItem key={item.id} value={item.id}>
																	{capitalizeFirstLetters(
																		item.name.toUpperCase(),
																	)}
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
									/> */}
									<Controller
										control={control}
										name='vehicle.model'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-model'>Modelo:</FieldLabel>
												<Input
													{...field}
													id='vehicle-model'
													value={field.value || ''}
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
													value={field.value ? String(field.value) : ''}
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
									<div />
									<Controller
										control={control}
										name='vehicle.usage'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='vehicle-usage'>
													Uso do Veículo:
												</FieldLabel>
												<Select
													{...field}
													onValueChange={(value) => {
														field.onChange(value);

														if (!getValues('vehicle.overnightPostalCode')) {
															setTimeout(() => {
																setFocus('vehicle.overnightPostalCode');
															}, 500);
														}
													}}
												>
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
													onBlur={() => {
														field.onBlur();

														if (!getValues('driver.registration')) {
															setFocus('driver.registration');
														}
													}}
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
								<FieldSet tabIndex={-1}>
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
																		registration: getValues(
																			'insured.registration',
																		),
																		name: getValues('insured.name'),
																		birth: getValues('insured.birth'),
																	}),
																	clearErrors('driver'),
																	setFocus('receivables.installments'),
																]
															: undefined,
													]}
												/>
												<Label
													htmlFor='the-same-driver'
													className='font-normal text-xs'
													tabIndex={-1}
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
										name='driver.registration'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='driver-cpf'>CPF:</FieldLabel>
												<div className='flex flex-row items-center justify-between'>
													<Input
														{...field}
														id='driver-cpf'
														aria-invalid={fieldState.invalid}
														disabled={theInsuredPartyIsTheDriver}
														placeholder='000.000.000-00'
														onChange={({ target: { value } }) => {
															const valueMask =
																value.length >= 11
																	? isCPF(value)
																		? maskCPF(value)
																		: maskCNPJ(value)
																	: value;

															field.onChange(valueMask);

															if (value.length === 0) {
																setValue('driver.name', '');
																setValue('driver.birth', '');
															}
														}}
													/>
													{field.value &&
														isPlate(field.value) &&
														isPendingCpfOrCnpjSearchDriver && (
															<Loader2Icon className='animate-spin size-4 text-muted-foreground ml-3' />
														)}
												</div>

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
																: field.value instanceof Date
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
													{isValid(
														typeof field.value === 'string'
															? parse(field.value, 'dd/MM/yyyy', new Date())
															: (field.value as Date),
													) &&
														differenceInYears(
															new Date(),
															typeof field.value === 'string'
																? parse(field.value, 'dd/MM/yyyy', new Date())
																: (field.value as Date),
														) <= 120 &&
														differenceInYears(
															new Date(),
															typeof field.value === 'string'
																? parse(field.value, 'dd/MM/yyyy', new Date())
																: (field.value as Date),
														) >= 18 && (
															<InputGroupAddon>
																<InputGroupText>
																	{differenceInYears(
																		new Date(),
																		typeof field.value === 'string'
																			? parse(
																					field.value,
																					'dd/MM/yyyy',
																					new Date(),
																				)
																			: (field.value as Date),
																	)}{' '}
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
								</FieldGroup>
							</FieldGroup>
							<Separator />
							<FieldGroup>
								<FieldSet>
									<FieldContent>
										<FieldTitle className='text-base'>
											<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
												<CircleDollarSignIcon />
											</div>
											Valores
										</FieldTitle>
									</FieldContent>
								</FieldSet>
								<FieldGroup className='grid grid-cols-5'>
									<Controller
										control={control}
										name='producer'
										render={({ field, fieldState }) => (
											<Field
												data-invalid={fieldState.invalid}
												className='relative'
											>
												<FieldLabel>Produtor:</FieldLabel>
												<Select
													{...field}
													value={!field.value ? '' : field.value || ''}
													onValueChange={(value) => {
														field.onChange(value === 'clear' ? null : value);

														if (!getValues('commissions.type')) {
															setValue(
																'commissions.type',
																'by_the_brokerage_commission',
															);
														}

														if (value === 'clear') {
															setValue('commissions', null);
														}
													}}
												>
													<SelectTrigger aria-invalid={fieldState.invalid}>
														<SelectValue placeholder='Nenhum produtor' />
													</SelectTrigger>
													<SelectContent
														align='start'
														side='bottom'
														className='max-h-72'
													>
														{producers?.map(({ id, avatar, name, contact }) => (
															<SelectItem key={id} value={id}>
																<div className='flex flex-row items-center justify-start gap-x-2'>
																	<Avatar className='size-6 rounded-full border'>
																		<AvatarImage
																			src={avatar || placeholder.user}
																			width={128}
																			height={128}
																			alt={`Produtor - ${capitalizeFirstLetters(name)}`}
																		/>
																		<AvatarFallback>
																			{name.slice(0, 2)}
																		</AvatarFallback>
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
													</SelectContent>
												</Select>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
												{existsProducer && !fieldState.invalid && (
													<FieldError
														className='text-destructive flex flex-row items-center justify-end absolute right-0 -bottom-4.5 cursor-pointer'
														onClick={() => field.onChange(null)}
													>
														<span className='truncate line-clamp-1 -mr-1'>
															Remover Produtor
														</span>{' '}
														<XCircleIcon className='size-3' />
													</FieldError>
												)}
											</Field>
										)}
									/>
									<Controller
										control={control}
										name='receivables.installments'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='installments'>
													Parcelas:
												</FieldLabel>
												<Input
													{...field}
													value={field.value ? Number(field.value) : ''}
													id='installments'
													placeholder='X vezes'
													type='number'
													aria-invalid={fieldState.invalid}
													onChange={({ target: { value } }) =>
														field.onChange(maskNumber(value))
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
										name='receivables.award'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='award'>Prêmio Líquido:</FieldLabel>
												<Input
													{...field}
													ref={withMask('brl-currency')}
													id='award'
													aria-invalid={fieldState.invalid}
													value={String(field.value || '')}
													placeholder='R$ 000,00'
													className='text-left!'
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<Controller
										control={control}
										name='receivables.franchise'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='franchise'>Frânquia:</FieldLabel>
												<Input
													{...field}
													ref={withMask('brl-currency')}
													id='franchise'
													aria-invalid={fieldState.invalid}
													value={String(field.value || '')}
													placeholder='R$ 000,00'
													className='text-left!'
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<Controller
										control={control}
										name='receivables.commission'
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor='commission'>Comissão:</FieldLabel>
												<Input
													{...field}
													ref={withMask('decimal')}
													id='commission'
													aria-invalid={fieldState.invalid}
													value={String(field.value || '')}
													placeholder='0,00'
													className='text-left!'
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
								</FieldGroup>
							</FieldGroup>
							{existsProducer && (
								<div className='bg-muted-foreground/10 flex flex-col gap-4 -mx-4 p-4'>
									<FieldSet>
										<FieldContent>
											<FieldTitle className='text-base'>
												<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
													<User2Icon />
												</div>
												Comissionamento
											</FieldTitle>
										</FieldContent>
									</FieldSet>
									<FieldGroup className='grid grid-cols-4'>
										<Controller
											control={control}
											name='commissions.type'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='commissions-type'>
														Tipo de Comissão:
													</FieldLabel>
													<Select {...field} onValueChange={field.onChange}>
														<SelectTrigger
															id='commissions-type'
															aria-invalid={fieldState.invalid}
														>
															<SelectValue placeholder='Selecionar' />
														</SelectTrigger>
														<SelectContent align='start'>
															<SelectItem
																value={
																	SchemaSafeCommission.shape.type.enum
																		.by_the_brokerage_commission
																}
															>
																{translateSafeCommissionType(
																	SchemaSafeCommission.shape.type.enum
																		.by_the_brokerage_commission,
																)}
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
											name='commissions.percentage'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='receivables-commission'>
														Percentual:
													</FieldLabel>
													<Input
														{...field}
														ref={withMask('decimal')}
														id='commission'
														aria-invalid={fieldState.invalid}
														value={String(field.value || '')}
														placeholder='0,00'
														className='text-left!'
													/>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</Field>
											)}
										/>
										<Controller
											control={control}
											name='commissions.installments'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='commissions-installments'>
														Pagar em X Parcelas:
													</FieldLabel>
													<Input
														{...field}
														id='commissions-installments'
														value={field.value ? Number(field.value) : ''}
														placeholder='X vezes'
														type='number'
														aria-invalid={fieldState.invalid}
														onChange={({ target: { value } }) =>
															field.onChange(maskNumber(value))
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
											name='commissions.paymentDate'
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor='commissions-payment-date'>
														Data de Pagamento:
													</FieldLabel>
													<Input
														{...field}
														id='commissions-payment-date'
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
																: field.value instanceof Date
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
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</Field>
											)}
										/>
									</FieldGroup>
								</div>
							)}
							<Separator />
							<FieldGroup className='grid grid-cols-4 gap-8!'>
								<FieldGroup>
									<FieldSet>
										<FieldContent>
											<FieldTitle className='text-base'>
												<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
													<Building2Icon />
												</div>
												Corretora
											</FieldTitle>
										</FieldContent>
									</FieldSet>
									<FieldGroup className='gap-0! space-y-1'>
										<Field orientation='horizontal'>
											<FieldLabel>Parcelas</FieldLabel>
											<FieldLabel className='text-right'>
												{installments > 0 ? `${installments}X` : '---------'}
											</FieldLabel>
										</Field>
										<Field orientation='horizontal'>
											<FieldLabel>Prêmio Líquido</FieldLabel>
											<FieldLabel className='text-right'>
												{commissionPercentage > 0
													? `${commissionPercentage}% | `
													: undefined}
												{award > 0
													? new Intl.NumberFormat('pt-BR', {
															style: 'currency',
															currency: 'BRL',
														}).format(award)
													: '---------'}
											</FieldLabel>
										</Field>
										<Field orientation='horizontal'>
											<FieldLabel>Comissão da Corretora</FieldLabel>
											<FieldLabel className='text-right'>
												{commissionAmount > 0
													? new Intl.NumberFormat('pt-BR', {
															style: 'currency',
															currency: 'BRL',
														}).format(commissionAmount)
													: '---------'}
											</FieldLabel>
										</Field>
									</FieldGroup>
								</FieldGroup>
								{existsProducer && (
									<FieldGroup>
										<FieldSet>
											<FieldContent>
												<FieldTitle className='text-base'>
													<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
														<User2Icon />
													</div>
													Produtor
												</FieldTitle>
											</FieldContent>
										</FieldSet>
										<FieldGroup className='gap-0! space-y-1'>
											<Field orientation='horizontal'>
												<FieldLabel>Parcelas de Comissão</FieldLabel>
												<FieldLabel className='text-right'>
													{installmentsProducer > 0
														? `${installmentsProducer}X`
														: '---------'}
												</FieldLabel>
											</Field>
											<Field orientation='horizontal'>
												<FieldLabel>Porcentagem do Produtor</FieldLabel>
												<FieldLabel className='text-right'>
													{commissionPercentageProducer > 0
														? `${commissionPercentageProducer}%`
														: undefined}
												</FieldLabel>
											</Field>
											<Field orientation='horizontal'>
												<FieldLabel>Comissão do Produtor</FieldLabel>
												<FieldLabel className='text-right'>
													{commissionAmountProducer > 0
														? new Intl.NumberFormat('pt-BR', {
																style: 'currency',
																currency: 'BRL',
															}).format(commissionAmountProducer)
														: '---------'}
												</FieldLabel>
											</Field>
										</FieldGroup>
									</FieldGroup>
								)}
								<FieldGroup className='col-start-4'>
									<FieldSet className='opacity-0 pointer-events-auto'>
										<FieldContent>
											<FieldTitle className='text-base'>
												<div className='size-8 bg-muted/50 border rounded-full flex items-center justify-center [&>svg]:size-4.5'>
													<Building2Icon />
												</div>
												Corretora
											</FieldTitle>
										</FieldContent>
									</FieldSet>
									<FieldGroup className='gap-0! space-y-1'>
										{existsProducer && (
											<Field orientation='horizontal'>
												<FieldLabel>
													Total Bruto{' '}
													<sup className='text-muted-foreground ml-2'>
														( Sem Comissão do Produtor )
													</sup>
												</FieldLabel>
												<FieldLabel className='text-right'>
													{commissionGross
														? new Intl.NumberFormat('pt-BR', {
																style: 'currency',
																currency: 'BRL',
															}).format(commissionGross)
														: '---------'}
												</FieldLabel>
											</Field>
										)}
										<Field orientation='horizontal'>
											<FieldLabel>
												Total {existsProducer && 'Líquido'}
											</FieldLabel>
											<FieldLabel className='text-right'>
												{commissionPercentageProducer >= 100 || commissionNet
													? new Intl.NumberFormat('pt-BR', {
															style: 'currency',
															currency: 'BRL',
														}).format(commissionNet)
													: '---------'}
											</FieldLabel>
										</Field>
									</FieldGroup>
								</FieldGroup>
							</FieldGroup>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
			<Button
				type='submit'
				form='form-proposal-register'
				className='w-full'
				disabled={isMutation || isUpdation || !isDirty}
				textPending={
					!id ? 'Salvando' : !!id && renewal ? 'Salvando' : 'Atualizando'
				}
			>
				<SaveIcon /> {!id ? 'Salvar' : !!id && renewal ? 'Salvar' : 'Atualizar'}{' '}
				Registro
			</Button>
		</Fragment>
	);
}

function DialogGetPlate({
	children,
	onChange,
}: React.PropsWithChildren<{
	onChange: (props: QuoteRegister) => void;
}>) {
	// @ts-expect-error
	const Comp = cloneElement(children, {
		onSelect: (e) => e.preventDefault(),
	});

	const Schema = z.object({
		plate: SchemaPlate,
	});

	const [open, setOpen] = useState<boolean>(false);

	const { data, mutate, isPending } = useQuotesByPlate();

	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(Schema),
		defaultValues: {
			plate: '',
		},
	});

	function onSubmit({ plate }: z.infer<typeof Schema>) {
		toast.dismiss();

		mutate(plate, {
			onError(error) {
				toast.error(error.message);
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{Comp}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Pesquisar Cotação</DialogTitle>
					<DialogDescription>
						Informe a placa do veículo a ser consultado
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} noValidate>
					<Controller
						control={control}
						name='plate'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='plate-search'>Placa:</FieldLabel>
								<Input
									{...field}
									id='plate-search'
									placeholder='AAA-0000 / AAA0A00'
									aria-invalid={fieldState.invalid}
									onChange={({ target: { value } }) =>
										field.onChange(maskPlate(value))
									}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					{!!data && (
						<div className='mt-2 bg-border rounded-md p-3'>
							<div className='text-sm'>
								Segurado:{' '}
								<b>
									{capitalizeFirstLetters(data.insured.name)} -{' '}
									{data.insured.cpf
										? isCPF(data.insured.cpf)
											? maskCPF(data.insured.cpf)
											: maskCNPJ(data.insured.cpf)
										: ''}
								</b>
							</div>
							<Separator className='bg-primary/20 my-2' />
							<div>
								<div className='text-sm'>
									Placa:{' '}
									<b>
										{data.vehicle?.plate
											? maskPlate(data.vehicle?.plate)
											: 'Sem Placa'}
									</b>
								</div>
								<div className='text-sm'>
									Marca:{' '}
									<b>
										{capitalizeFirstLetters(
											data.vehicle?.manufacturer as string,
										)}
									</b>
								</div>
								<div className='text-sm'>
									Modelo:{' '}
									<b>{capitalizeFirstLetters(data.vehicle?.model as string)}</b>
								</div>
								<div className='text-sm'>
									Ano: <b>{data.vehicle?.modelYear}</b>
								</div>
							</div>
							<Button
								size='sm'
								onClick={() => [
									onChange({
										...data,
										insured: {
											...data.insured,
											...(data.insured.birth && {
												birth: new Date(
													data.insured.birth.getTime() +
														data.insured.birth.getTimezoneOffset() * 60000,
												),
											}),
										},
										driver: {
											...data.driver,
											...(data.driver.birth && {
												birth: new Date(
													data.driver.birth.getTime() +
														data.driver.birth.getTimezoneOffset() * 60000,
												),
											}),
										},
									}),
									setOpen(false),
								]}
								className='w-full mt-3'
							>
								Preencher Dados
							</Button>
						</div>
					)}
				</form>
				<Separator />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='destructive' tabIndex={-1}>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button
						disabled={!isValid}
						onClick={handleSubmit(onSubmit)}
						isPending={isPending}
						textPending='Consultando'
					>
						Consultar <SearchIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

type ExtractDocument = {
	modality:
		| 'vehicle'
		| 'motorcycle'
		| 'truck'
		| 'health'
		| 'residence'
		| 'business'
		| 'condominium'
		| 'travel'
		| 'professional'
		| 'construction';
	insuranceCompany: {
		name: string;
		cnpj: string;
	};
	insured: {
		name: string;
		registration: string;
		phone: string;
		birth: string;
		profession: string | null;
	};
	vehicle: {
		plate: string;
		model: string;
		year: number;
		usage:
			| 'leisure_and_work'
			| 'leisure'
			| 'client_supplier_visits'
			| 'app_based_transport'
			| 'taxi'
			| 'public_transportation'
			| 'delivieries'
			| 'tourism';
		overnightStayPostalCode: string;
		driver: {
			name: string;
			cpf: string;
			birth: string;
		} | null;
	} | null;
	effectivedAt: string;
	requestedAt: string;
	expirationAt: string;
	award: number;
	installments: number;
	franchise: number;
};

function resolveInsuranceCompany(
	matches: Array<{
		id: string;
		name: string;
		cnpj: string;
	}>,
	targetName: string,
): { id: string; name: string; cnpj: string } | undefined {
	if (matches.length <= 1) {
		return matches[0];
	}

	const normalizedTarget = normalizeName(targetName);

	const exactNameMatch = matches.find(
		(m) => normalizeName(m.name) === normalizedTarget,
	);

	if (exactNameMatch) {
		return exactNameMatch;
	}

	const partialMatch = matches.find(
		(m) =>
			normalizedTarget.includes(normalizeName(m.name)) ||
			normalizeName(m.name).includes(normalizedTarget),
	);

	return partialMatch ?? matches[0];
}

function normalizeName(name: string) {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

function DialogGetDocument({
	open,
	onOpenChange,
	onChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onChange: (props: QuoteRegister) => void;
}) {
	const { data: insuranceCompanies } = useInsuranceCompaniesSimple();

	const Schema = z.object({
		file: z.file('Documento inválido'),
	});

	const { data, mutate, isPending, isSuccess, reset } = useMutation<
		ExtractDocument,
		Error,
		z.infer<typeof Schema.shape.file>
	>({
		mutationKey: ['safe', 'extract', 'pdf'],
		mutationFn: async (file) => {
			const formData = new FormData();

			formData.append('file', file);

			const response = await fetch(
				`${api.config?.baseURL as string}/safes/extract-pdf`,
				{
					method: 'POST',
					body: formData,
				},
			);

			if (!response.ok) {
				throw new Error((await response.json()).message);
			}

			const data = await response.json();

			return data;
		},
	});

	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(Schema),
	});

	function onSubmit({ file }: z.infer<typeof Schema>) {
		toast.dismiss();

		mutate(file, {
			onError(error) {
				toast.error(error.message);
			},
		});
	}

	function sendData(data: ExtractDocument) {
		const matchesCompanies =
			insuranceCompanies?.filter(
				(e) => maskNumber(e.cnpj) === maskNumber(data.insuranceCompany.cnpj),
			) ?? [];

		const company = resolveInsuranceCompany(
			matchesCompanies,
			data.insuranceCompany.name,
		);

		const send: QuoteRegister = {
			driver: {
				birth: parse(
					data.vehicle?.driver?.birth ?? data.insured.birth,
					'dd/MM/yyyy',
					startOfToday(),
				),
				cpf: data.vehicle?.driver?.cpf ?? data.insured.registration,
				name: data.vehicle?.driver?.name ?? data.insured.name,
			},
			expiration: parse(data.expirationAt, 'dd/MM/yyyy', endOfToday()),
			insuranceCompany: company?.id,
			// @ts-expect-error
			insured: {
				birth: parse(data.insured.birth, 'dd/MM/yyyy', startOfToday()),
				cpf: data.insured.registration,
				name: data.insured.name,
				phone: data.insured.phone,
			},
			modality: data.modality,
			requestedAt: parse(data.requestedAt, 'dd/MM/yyyy', startOfToday()),
			vehicle: {
				plate: data.vehicle?.plate,
				model: data.vehicle?.model ?? '',
				modelYear: data.vehicle?.year ?? 0,
				overnightPostalCode: data.vehicle?.overnightStayPostalCode ?? '',
				// @ts-expect-error
				usage: data.vehicle?.usage,
			},
			receivables: {
				award: data.award,
				franchise: data.franchise,
				installments: data.installments,
			},
		};

		onChange(send);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='flex flex-row items-center justify-start gap-x-1'>
						<BrainIcon className='size-5' /> Preenchimento via PDF
					</DialogTitle>
					<DialogDescription>
						Informe o documento para a IA extrair os dados
					</DialogDescription>
				</DialogHeader>
				<Separator />
				{(!isPending || (isSuccess && !data)) && (
					<form onSubmit={handleSubmit(onSubmit)} noValidate>
						<Controller
							control={control}
							name='file'
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor='document'>Documento:</FieldLabel>
									<Input
										{...field}
										value={undefined}
										type='file'
										id='document'
										placeholder='Insira o documento'
										aria-invalid={fieldState.invalid}
										onChange={(e) => {
											const file = e.target.files?.[0];

											reset();

											if (file) {
												field.onChange(file);
											}
										}}
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						{!!data && (
							<InsuranceDataPreview
								data={data}
								onConfirm={(parsed) => {
									onOpenChange(false);

									reset();
									sendData(parsed);
								}}
								onCancel={() => {
									reset();
								}}
							/>
						)}
					</form>
				)}
				{isPending && <DocumentProcessingLoader />}
				<Separator />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='destructive' tabIndex={-1}>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button
						disabled={!isValid || isPending}
						onClick={handleSubmit(onSubmit)}
						isPending={isPending}
						textPending='Extraindo'
					>
						Extrair <FileCogIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DocumentProcessingLoader({
	label = 'Processando documento',
	sublabel = 'Extraindo dados',
}: {
	label?: string;
	sublabel?: string;
}) {
	return (
		<div className='flex flex-row items-center gap-4 rounded-lg border border-border bg-card px-10 py-8 w-full'>
			<div className='relative flex h-14 w-14 items-center justify-center'>
				<div className='absolute inset-0 animate-spin rounded-full border-[2.5px] border-muted border-t-primary' />
				<BrainIcon className='h-5 w-5 text-primary' />
			</div>
			<div className='text-left'>
				<p className='text-sm font-medium text-foreground'>{label}</p>
				<p className='text-xs text-muted-foreground'>
					{sublabel}
					<span className='inline-flex'>
						<span className='animate-blink'>.</span>
						<span className='animate-blink' style={{ animationDelay: '0.2s' }}>
							.
						</span>
						<span className='animate-blink' style={{ animationDelay: '0.4s' }}>
							.
						</span>
					</span>
				</p>
			</div>
			<div className='flex-1'>
				<div className='bg-muted rounded-full size-10 ml-auto flex flex-row items-center justify-center'>
					<FileTextIcon className='text-muted-foreground size-5' />
				</div>
			</div>
		</div>
	);
}

function InsuranceDataPreview({
	data,
	onConfirm,
	onCancel,
}: {
	data: ExtractDocument;
	onConfirm: (data: ExtractDocument) => void;
	onCancel: () => void;
}) {
	return (
		<div className='mt-2 bg-border rounded-md p-3'>
			<div className='text-sm'>
				Modalidade: <b>{translateModality(data.modality)}</b>
			</div>
			<div className='text-sm'>
				Seguradora:{' '}
				<b>
					{capitalizeFirstLetters(data.insuranceCompany.name)
						.replace('s.a', 'S.A')
						.replace('S.a', 'S.A')
						.replace('Ltda', 'LTDA')}{' '}
					- {maskCNPJ(data.insuranceCompany.cnpj)}
				</b>
			</div>
			<Separator className='bg-primary/20 my-2' />
			<div className='text-sm mb-2'>
				Segurado: <b>{capitalizeFirstLetters(data.insured.name)}</b>
			</div>
			<div className='flex flex-row items-center justify-between'>
				<div className='text-sm'>
					CPF/CNPJ:{' '}
					<b>
						{isCNPJ(data.insured.registration)
							? maskCNPJ(data.insured.registration)
							: maskCPF(data.insured.registration)}
					</b>
				</div>
				<div className='text-sm'>
					Nascimento: <b>{data.insured.birth}</b>
				</div>
			</div>
			<div className='flex flex-row items-center justify-between'>
				<div className='text-sm'>
					Celular: <b>{maskPhone(data.insured.phone)}</b>
				</div>
				{data.insured.profession && (
					<div className='text-sm'>
						Profissão: <b>{capitalizeFirstLetters(data.insured.profession)}</b>
					</div>
				)}
			</div>
			{data.vehicle && (
				<>
					<Separator className='bg-primary/20 my-2' />
					<div className='flex flex-row items-center justify-between gap-x-2'>
						<div className='text-sm'>
							Placa: <b>{maskPlate(data.vehicle.plate)}</b>
						</div>
						<div className='text-sm'>
							Modelo: <b>{capitalizeFirstLetters(data.vehicle.model)}</b>
						</div>
					</div>
					<div className='text-sm'>
						Ano: <b>{data.vehicle.year}</b>
					</div>
					<div className='flex flex-row items-center justify-between'>
						<div className='text-sm'>
							CEP de Pernoite:{' '}
							<b>{maskPostalCode(data.vehicle.overnightStayPostalCode)}</b>
						</div>
						<div className='text-sm'>
							Uso: <b>{translateVehicleUsage(data.vehicle.usage)}</b>
						</div>
					</div>
					{data.vehicle.driver && (
						<>
							<Separator className='bg-primary/20 my-2' />
							<div className='text-sm mb-2'>
								Condutor:{' '}
								<b>{capitalizeFirstLetters(data.vehicle.driver.name)}</b>
							</div>
							<div className='flex flex-row items-center justify-between'>
								<div className='text-sm'>
									CPF: <b>{maskCPF(data.vehicle.driver.cpf)}</b>
								</div>
								<div className='text-sm'>
									Nascimento: <b>{data.vehicle.driver.birth}</b>
								</div>
							</div>
						</>
					)}
				</>
			)}
			<Separator className='bg-primary/20 my-2' />
			{/* <div className='text-sm'>
				Vigência: <b>{data.effectivedAt}</b>
			</div> */}
			<div className='text-sm'>
				Vigência:{' '}
				<b>
					{data.requestedAt} - {data.expirationAt}
				</b>
			</div>
			<div className='flex flex-row items-center justify-start gap-x-2 mt-1'>
				<div className='text-sm'>
					Prêmio:{' '}
					<b>
						{new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
						}).format(data.award)}
					</b>
				</div>
				<div className='text-sm'>
					Parcelas: <b>{data.installments}x</b>
				</div>
				<div className='text-sm'>
					Frânquia:{' '}
					<b>
						{new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
						}).format(data.franchise)}
					</b>
				</div>
			</div>
			<div className='flex gap-2 mt-3'>
				<Button
					variant='outline'
					size='sm'
					className='w-full'
					onClick={onCancel}
				>
					Descartar
				</Button>
				<Button size='sm' className='w-full' onClick={() => onConfirm(data)}>
					Preencher Dados
				</Button>
			</div>
		</div>
	);
}

export { FormProposalRegister };
