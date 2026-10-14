'use client';

import { zodResolver } from '@hookform/resolvers/zod';

import {
	calculatePercentageOfValue,
	capitalizeFirstLetters,
	type EndorsementAddress,
	type EndorsementCancel,
	type EndorsementFranchise,
	type EndorsementVehicleConductor,
	getNumericValue,
	isCPF,
	isPlate,
	maskCPF,
	maskNumber,
	maskPlate,
	maskPostalCode,
	SchemaEndorsementAddress,
	SchemaEndorsementCancel,
	SchemaEndorsementFranchise,
	SchemaEndorsementVehicleConductor,
} from '@segwise/core';
import { useMutation } from '@tanstack/react-query';
import { format, startOfToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
	CarIcon,
	DollarSignIcon,
	FilePenIcon,
	FilePlusIcon,
	Loader2Icon,
	MapPinIcon,
	SaveIcon,
	TriangleAlertIcon,
	UploadIcon,
	XCircleIcon,
} from 'lucide-react';
import type React from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import { api } from '@/libraries/api';
import { useCpfOrCnpj } from '@/libraries/hooks/use-cpf-or-cnpj';
import {
	useEndorsementAddress,
	useEndorsementCancel,
	useEndorsementFranchise,
	useEndorsementPercentage,
	useEndorsements,
	useEndorsementVehicleConductor,
	useEndorsementVehicleConductorQuery,
} from '@/libraries/hooks/use-endorsement';
import { useVehiclesPlate } from '@/libraries/hooks/vehicles/use-vehicles-plate';
import { cn } from '@/libraries/utils';

interface DialogSafeEndorsementByIdProps {
	id: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface DialogSafeEndorsementDetailsProps {
	id?: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const DRIVER_MISSING_MESSAGE =
	'O documento não informa o CPF do principal condutor. Informe-o manualmente.';

const plateKey = (value?: string | null) =>
	(value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();

function commissionFromAmountAndPercentage(
	amount: unknown,
	percentage: unknown,
) {
	const numericAmount = getNumericValue(
		amount == null ? 0 : (amount as number),
	);
	const numericPercentage = percentage == null ? 0 : Number(percentage);

	return calculatePercentageOfValue(numericAmount, numericPercentage);
}

type VehicleConductorFields = {
	// null quando o documento não informa o CPF do principal condutor.
	driver: string | null;
	// Nome do condutor, quando o retorno já o traz (evita consultar o CPF de novo).
	driverName?: string | null;
	plate: string | null;
	model: string;
	modelYear: string | number;
	franchise: number;
	amount: number;
	percentage: number;
};

type AddressFields = {
	postalCode: string;
	amount: number;
	percentage: number;
};

type FranchiseFields = {
	franchise: number;
	amount: number;
	percentage: number;
};

type CancelFields = {
	effectivedAt: Date;
};

type DocumentFieldsMap = {
	vehicle_conductor: VehicleConductorFields;
	address: AddressFields;
	franchise: FranchiseFields;
	cancellation: CancelFields;
};

type ExtractEndorsementDocument = {
	[K in keyof DocumentFieldsMap]: {
		safeId: string;
		type: K;
		data: DocumentFieldsMap[K];
	};
}[keyof DocumentFieldsMap];

function DialogSafeEndorsementById({
	id,
	open,
	onOpenChange,
}: DialogSafeEndorsementByIdProps) {
	const { data, isPending } = useEndorsements(id, open);

	const [openId, setOpenId] = useState<boolean>(false);

	return (
		<Fragment>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Endossos do Seguro</DialogTitle>
						<DialogDescription>
							Aqui estão os endossos gerados da proposta
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
								Não há endosso para a proposta vigente
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
						<DialogClose>
							<Button variant='destructive' tabIndex={-1}>
								Fechar <XCircleIcon />
							</Button>
						</DialogClose>
						<Button onClick={() => setOpenId(true)}>
							Novo Endosso <FilePlusIcon />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<DialogSafeEndorsementDetails
				id={id}
				open={openId}
				onOpenChange={setOpenId}
			/>
		</Fragment>
	);
}

function EndorsementDropzone({
	id,
	onChangePending,
	onExtracted,
}: {
	id?: string | null;
	onChangePending: (pending: boolean) => void;
	onExtracted: (data: ExtractEndorsementDocument) => void;
}) {
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);

	const { mutate, isPending } = useMutation<
		ExtractEndorsementDocument,
		Error,
		File
	>({
		mutationKey: ['endorsement', 'extract', 'pdf'],
		mutationFn: async (file) => {
			const formData = new FormData();

			formData.append('file', file);

			const url = new URL(
				`${api.config?.baseURL as string}/endorsements/extract-pdf`,
			);

			if (id) {
				url.searchParams.append('id', id);
			}

			const response = await fetch(url.toString(), {
				method: 'POST',
				body: formData,
				credentials: 'include',
				headers: {
					'X-Client-App': process.env.NEXT_PUBLIC_ROLE_SYSTEM as string,
					'X-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
				},
			});

			if (!response.ok) {
				throw new Error((await response.json()).message);
			}

			const data = await response.json();

			return data;
		},
	});

	function handleFile(file: File | undefined) {
		if (!file) {
			return;
		}

		setFileName(file.name);

		toast.dismiss();

		mutate(file, {
			onSuccess(extracted) {
				onExtracted(extracted);
			},
			onError(error) {
				toast.error(error.message, {
					description: 'Tente novamente!',
				});
			},
		});
	}

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}

	function handleDragLeave(e: React.DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];

		if (file) {
			handleFile(file);
		}
	}

	useEffect(() => {
		onChangePending(isPending);
	}, [isPending, onChangePending]);

	return (
		<Field>
			<FieldLabel htmlFor='endorsement-document'>
				Documento de Endosso:
			</FieldLabel>
			<label
				htmlFor='endorsement-document'
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={cn(
					'flex flex-col items-center justify-center gap-y-2 rounded-md border-2 border-dashed p-6 transition-colors cursor-pointer',
					isDragging
						? 'border-primary bg-primary/5'
						: 'border-muted-foreground/25',
				)}
			>
				{isPending ? (
					<Loader2Icon className='size-6 text-muted-foreground animate-spin' />
				) : (
					<UploadIcon className='size-6 text-muted-foreground' />
				)}
				<p className='text-sm text-muted-foreground'>
					{isPending
						? 'Extraindo dados do documento...'
						: 'Arraste o PDF aqui ou clique para selecionar'}
				</p>
				<Input
					type='file'
					id='endorsement-document'
					accept='application/pdf'
					hidden
					disabled={isPending}
					className='cursor-pointer file:cursor-pointer hidden'
					onChange={(e) => handleFile(e.target.files?.[0])}
				/>
			</label>
			{fileName && !isPending && (
				<FieldDescription className='text-xs'>
					Último arquivo enviado: {fileName}
				</FieldDescription>
			)}
		</Field>
	);
}

function DialogSafeEndorsementDetails({
	id: idProp,
	open,
	onOpenChange,
}: DialogSafeEndorsementDetailsProps) {
	const [type, setType] = useState<
		'vehicle_conductor' | 'address' | 'franchise' | 'cancellation' | null
	>(null);

	const [notPlate, setNotPlate] = useState<boolean>(false);

	// O documento enviado não trouxe o CPF do principal condutor (driver = null).
	const [driverMissing, setDriverMissing] = useState<boolean>(false);

	// Dados que já vieram do retorno da extração: enquanto o campo continuar com o
	// valor do retorno, não se consulta de novo (cada consulta de placa/CPF custa).
	// - placa: só quando veio a placa COM o modelo;
	// - condutor: só quando veio o CPF COM o nome.
	const [pdfPlateKey, setPdfPlateKey] = useState<string | null>(null);
	const [pdfDriver, setPdfDriver] = useState<{
		cpf: string;
		name: string;
	} | null>(null);

	const [resolvedId, setResolvedId] = useState<string | null>(idProp ?? null);

	const [formUnlocked, setFormUnlocked] = useState<boolean>(false);

	const id = resolvedId ?? '';

	const formIsLocked = !formUnlocked;

	const [isQuering, setIsQuering] = useState<boolean>(false);

	const { data: endorsementPercentage } = useEndorsementPercentage(id, {
		enabled: open && !!type && !!resolvedId,
	});
	const { data: vehicleConductorQuery } = useEndorsementVehicleConductorQuery(
		id,
		type === 'vehicle_conductor' && !!resolvedId,
	);
	const { mutate: vehicleConductor, isPending: isPendingVehicleCondutor } =
		useEndorsementVehicleConductor();
	const { mutate: address, isPending: isPendingAddress } =
		useEndorsementAddress();
	const { mutate: franchise, isPending: isPendingFranchise } =
		useEndorsementFranchise();
	const { mutate: cancel, isPending: isCanceling } = useEndorsementCancel();

	const formVehicleConductor = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaEndorsementVehicleConductor),
		defaultValues: {
			driver: vehicleConductorQuery?.driver.cpf
				? maskCPF(vehicleConductorQuery.driver.cpf)
				: '',
			plate: vehicleConductorQuery?.vehicle.plate
				? maskPlate(vehicleConductorQuery.vehicle.plate)
				: '',
			model: vehicleConductorQuery?.vehicle.model
				? capitalizeFirstLetters(vehicleConductorQuery.vehicle.model)
				: '',
			modelYear: vehicleConductorQuery?.vehicle.modelYear ?? '',
			franchise: 0,
			amount: 0,
			percentage: endorsementPercentage?.percentage || 0,
		},
	});

	// De onde vêm os dados do formulário. O PDF extraído sempre vence a consulta
	// do seguro atual e a consulta da placa, que chegam depois e sobrescreveriam
	// modelo, ano, franquia e valor do endosso.
	const pdfRef = useRef<{
		applied: boolean;
		plate: string | null;
		percentage: boolean;
	}>({ applied: false, plate: null, percentage: false });

	const formAddress = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaEndorsementAddress),
		defaultValues: {
			postalCode: '',
			amount: 0,
			percentage: endorsementPercentage?.percentage || 0,
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
			percentage: endorsementPercentage?.percentage || 0,
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

	const plate = useWatch({
		control: formVehicleConductor.control,
		name: 'plate',
	});

	const skipPlateLookup = !!pdfPlateKey && pdfPlateKey === plateKey(plate);

	// Pré-preenche com os dados atuais do seguro só enquanto não houver PDF.
	// biome-ignore lint/correctness/useExhaustiveDependencies: só reage à chegada da consulta
	useEffect(() => {
		if (!vehicleConductorQuery || pdfRef.current.applied) {
			return;
		}

		formVehicleConductor.reset({
			driver: maskCPF(vehicleConductorQuery.driver.cpf),
			plate: vehicleConductorQuery.vehicle.plate
				? maskPlate(vehicleConductorQuery.vehicle.plate)
				: null,
			model: capitalizeFirstLetters(vehicleConductorQuery.vehicle.model),
			modelYear: vehicleConductorQuery.vehicle.modelYear,
			franchise: 0,
			amount: 0,
			percentage: endorsementPercentage?.percentage || 0,
		});
	}, [vehicleConductorQuery]);

	// Percentual padrão da corretora: só entra se o PDF não trouxe um e o campo
	// ainda não foi preenchido.
	// biome-ignore lint/correctness/useExhaustiveDependencies: só reage à chegada da consulta
	useEffect(() => {
		const percentage = endorsementPercentage?.percentage;

		if (percentage == null || pdfRef.current.percentage) {
			return;
		}

		if (!Number(formVehicleConductor.getValues('percentage'))) {
			formVehicleConductor.setValue('percentage', percentage);
		}

		if (!Number(formAddress.getValues('percentage'))) {
			formAddress.setValue('percentage', percentage);
		}

		if (!Number(formFranchise.getValues('percentage'))) {
			formFranchise.setValue('percentage', percentage);
		}
	}, [endorsementPercentage]);

	const driver = useWatch({
		control: formVehicleConductor.control,
		name: 'driver',
	});

	const skipDriverLookup =
		!!pdfDriver && pdfDriver.cpf === maskNumber(driver ?? '');

	const amountVehicleConductor = useWatch({
		control: formVehicleConductor.control,
		name: 'amount',
	});

	const percentageVehicleConductor = useWatch({
		control: formVehicleConductor.control,
		name: 'percentage',
	});

	const amountAddress = useWatch({
		control: formAddress.control,
		name: 'amount',
	});

	const percentageAddress = useWatch({
		control: formAddress.control,
		name: 'percentage',
	});

	const amountFranchise = useWatch({
		control: formFranchise.control,
		name: 'amount',
	});

	const percentageFranchise = useWatch({
		control: formFranchise.control,
		name: 'percentage',
	});

	const {
		data: plateResponse,
		isPending: plateResponseIsPending,
		isError: plateResponseIsError,
	} = useVehiclesPlate(skipPlateLookup ? '' : (plate ?? ''));

	const { data: driverResponse } = useCpfOrCnpj(skipDriverLookup ? '' : driver);

	// Nome mostrado sob o CPF: o do retorno quando já veio, senão o da consulta.
	const driverName = skipDriverLookup ? pdfDriver?.name : driverResponse?.name;

	function onSubmitVehicleConductor(props: EndorsementVehicleConductor) {
		toast.dismiss();

		vehicleConductor(
			{
				...props,
				id,
				plate: notPlate ? null : props.plate,
			},
			{
				onSuccess(_, __, ___) {
					toast.success('Endosso registrado!'.toUpperCase());

					onOpenChange(false);
				},
				onError(error) {
					toast.error(
						(error.message ?? 'Falha ao registrar endosso').toUpperCase(),
					);
				},
			},
		);
	}

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

					onOpenChange(false);
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

					onOpenChange(false);
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

					onOpenChange(false);
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

	function handleExtractedDocument(extracted: ExtractEndorsementDocument) {
		if (idProp) {
			if (extracted.safeId && extracted.safeId !== idProp) {
				toast.error(
					'O documento enviado pertence a outro seguro e não corresponde à proposta atual.'.toUpperCase(),
				);

				return;
			}
		} else {
			setResolvedId(extracted.safeId);
		}

		setType(extracted.type);

		pdfRef.current = {
			applied: true,
			plate: null,
			percentage:
				'percentage' in extracted.data && extracted.data.percentage != null,
		};

		if (extracted.type === 'vehicle_conductor') {
			const parsedData = extracted.data;

			// Placa + modelo no retorno: valem como estão (sem consultar a placa). Só a
			// placa, sem modelo: a consulta é o que completa modelo e ano.
			const plateFromPdf =
				parsedData.plate && parsedData.model
					? plateKey(parsedData.plate)
					: null;

			pdfRef.current.plate = plateFromPdf;
			setPdfPlateKey(plateFromPdf);

			const pdfDriverName = parsedData.driverName?.trim();

			setPdfDriver(
				parsedData.driver && pdfDriverName
					? { cpf: maskNumber(parsedData.driver), name: pdfDriverName }
					: null,
			);

			setNotPlate(!parsedData.plate);

			// driver = null: o documento não traz o CPF do principal condutor. Limpa o
			// campo (nunca mantém o CPF cadastrado na apólice), avisa e leva o foco
			// até ele para o CPF ser informado manualmente.
			const missingDriver = !parsedData.driver;

			setDriverMissing(missingDriver);

			formVehicleConductor.setValue(
				'driver',
				missingDriver ? '' : maskCPF(parsedData.driver as string),
				missingDriver ? { shouldValidate: true, shouldTouch: true } : undefined,
			);

			if (missingDriver) {
				toast.warning(DRIVER_MISSING_MESSAGE.toUpperCase());

				setTimeout(() => document.getElementById('driver-cpf')?.focus(), 150);
			}
			formVehicleConductor.setValue(
				'plate',
				parsedData.plate ? maskPlate(parsedData.plate) : '',
			);
			formVehicleConductor.setValue(
				'model',
				capitalizeFirstLetters(parsedData.model ?? ''),
			);
			formVehicleConductor.setValue('modelYear', parsedData.modelYear ?? '');
			formVehicleConductor.setValue(
				'franchise',
				parsedData.franchise.toString().replace('.', ',') ?? '0',
			);
			formVehicleConductor.setValue(
				'amount',
				parsedData.amount.toString().replace('.', ',') ?? '0',
			);
			formVehicleConductor.setValue(
				'percentage',
				parsedData.percentage ?? endorsementPercentage?.percentage ?? 0,
			);
		}

		if (extracted.type === 'address') {
			const parsedData = extracted.data;

			formAddress.setValue(
				'postalCode',
				maskPostalCode(parsedData.postalCode ?? ''),
			);
			formAddress.setValue('amount', parsedData.amount ?? 0);
			formAddress.setValue(
				'percentage',
				parsedData.percentage ?? endorsementPercentage?.percentage ?? 0,
			);
		}

		if (extracted.type === 'franchise') {
			const parsedData = extracted.data;

			formFranchise.setValue('franchise', parsedData.franchise ?? 0);
			formFranchise.setValue('amount', parsedData.amount ?? 0);
			formFranchise.setValue(
				'percentage',
				parsedData.percentage ?? endorsementPercentage?.percentage ?? 0,
			);
		}

		if (extracted.type === 'cancellation') {
			const parsedData = extracted.data;

			formCancel.setValue(
				'effectivedAt',
				parsedData.effectivedAt
					? new Date(parsedData.effectivedAt)
					: startOfToday(),
			);
		}

		setFormUnlocked(true);
	}

	useEffect(() => {
		if (plateResponse) {
			// A placa é a do PDF: modelo e ano extraídos do documento valem.
			if (pdfRef.current.plate && pdfRef.current.plate === plateKey(plate)) {
				return;
			}

			formVehicleConductor.setValue(
				'model',
				capitalizeFirstLetters(plateResponse.model),
			);
			formVehicleConductor.setValue('modelYear', plateResponse.modelYear);
		}
	}, [formVehicleConductor, plateResponse, plate]);

	useEffect(() => {
		if (plateResponseIsError) {
			formVehicleConductor.setFocus('model');
		}
	}, [formVehicleConductor, plateResponseIsError]);

	function handleOpenChange(nextOpen: boolean) {
		onOpenChange(nextOpen);

		if (!nextOpen) {
			setType(null);
			setNotPlate(false);
			setDriverMissing(false);
			setPdfPlateKey(null);
			setPdfDriver(null);
			setResolvedId(idProp ?? null);
			setFormUnlocked(false);
			pdfRef.current = { applied: false, plate: null, percentage: false };
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent overlayOpacityDivide>
				<DialogHeader>
					<DialogTitle>Novo Endosso</DialogTitle>
					<DialogDescription>
						Adicione um novo registro de endosso para a proposta
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<div className='space-y-4 overflow-scroll max-h-[70vh]'>
					<EndorsementDropzone
						id={idProp}
						onChangePending={setIsQuering}
						onExtracted={handleExtractedDocument}
					/>
					{!isQuering && (
						<Fragment>
							{formIsLocked && (
								<div className='flex flex-col items-center gap-y-2 text-center'>
									<p className='text-sm text-muted-foreground'>
										{idProp
											? 'Envie o PDF do endosso para preenchimento automático, ou continue manualmente.'
											: 'Envie o PDF do endosso para a IA identificar o seguro e preencher os dados automaticamente.'}
									</p>
									{idProp && (
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={() => setFormUnlocked(true)}
										>
											<FilePenIcon /> Preencher manualmente
										</Button>
									)}
								</div>
							)}
							{!formIsLocked && (
								<>
									<Separator />
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
									{!resolvedId && (
										<FieldDescription className='text-xs'>
											Nenhum seguro identificado ainda — envie um PDF de endosso
											para a IA localizar a proposta.
										</FieldDescription>
									)}
									{type === 'vehicle_conductor' && (
										<form
											noValidate
											className='space-y-2 mt-4'
											onKeyDown={handleFormKeyDown}
										>
											<FieldGroup className='grid grid-cols-2 gap-2'>
												<Controller
													control={formVehicleConductor.control}
													name={notPlate ? 'model' : 'plate'}
													render={({ field, fieldState }) => (
														<Field data-invalid={fieldState.invalid}>
															<div className='flex flex-row items-center justify-between'>
																<FieldLabel>
																	{notPlate ? 'Modelo' : 'Placa'}:
																</FieldLabel>
																<FieldLabel
																	htmlFor='not-plate'
																	className='flex flex-row items-center justify-end gap-x-1 text-xs'
																>
																	Sem placa?{' '}
																	<Switch
																		id='not-plate'
																		size='sm'
																		checked={notPlate}
																		onCheckedChange={setNotPlate}
																	/>
																</FieldLabel>
															</div>
															{!notPlate && (
																<div className='flex flex-row items-center justify-between'>
																	<Input
																		{...field}
																		value={String(field.value ?? '')}
																		placeholder='AAA-0000 ou AAA0A00'
																		onChange={({ target: { value } }) => {
																			field.onChange(maskPlate(value));

																			if (
																				plateKey(value) !== pdfRef.current.plate
																			) {
																				pdfRef.current.plate = null;
																			}

																			if (!isPlate(value)) {
																				formVehicleConductor.setValue(
																					'model',
																					'',
																				);
																				formVehicleConductor.setValue(
																					'modelYear',
																					'',
																				);
																			}
																		}}
																	/>
																	{field.value &&
																		isPlate(field.value) &&
																		!skipPlateLookup &&
																		plateResponseIsPending && (
																			<Loader2Icon className='animate-spin size-4 text-muted-foreground ml-3' />
																		)}
																</div>
															)}
															{notPlate && (
																<Input
																	{...field}
																	value={String(field.value ?? '')}
																	placeholder='Modelo do veículo'
																	onChange={({ target: { value } }) =>
																		field.onChange(
																			capitalizeFirstLetters(value),
																		)
																	}
																/>
															)}
															{fieldState.invalid && (
																<FieldError errors={[fieldState.error]} />
															)}
														</Field>
													)}
												/>
												{!notPlate && (
													<Controller
														control={formVehicleConductor.control}
														name='model'
														render={({ field, fieldState }) => (
															<Field data-invalid={fieldState.invalid}>
																<FieldLabel htmlFor='model'>Modelo:</FieldLabel>
																<Input
																	{...field}
																	value={String(field.value ?? '')}
																	placeholder='Modelo do veículo'
																	onChange={({ target: { value } }) =>
																		field.onChange(
																			capitalizeFirstLetters(value),
																		)
																	}
																/>
																{fieldState.invalid && (
																	<FieldError errors={[fieldState.error]} />
																)}
															</Field>
														)}
													/>
												)}
												<Controller
													control={formVehicleConductor.control}
													name='modelYear'
													render={({ field, fieldState }) => (
														<Field data-invalid={fieldState.invalid}>
															<FieldLabel htmlFor='model-year'>
																Ano do Modelo:
															</FieldLabel>
															<Input
																{...field}
																id='model-year'
																aria-invalid={fieldState.invalid}
																value={String(field.value || '')}
																placeholder='0000'
															/>
															{fieldState.invalid && (
																<FieldError errors={[fieldState.error]} />
															)}
														</Field>
													)}
												/>
												<Controller
													control={formVehicleConductor.control}
													name='franchise'
													render={({ field, fieldState }) => (
														<Field
															data-invalid={fieldState.invalid}
															className={cn('', notPlate && 'col-span-full')}
														>
															<FieldLabel htmlFor='franchise'>
																Frânquia:
															</FieldLabel>
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
												<Controller
													control={formVehicleConductor.control}
													name='driver'
													render={({ field, fieldState }) => (
														<Field
															data-invalid={fieldState.invalid}
															className='col-span-full'
														>
															<FieldLabel htmlFor='driver-cpf'>
																CPF do Condutor:
															</FieldLabel>
															<Input
																{...field}
																id='driver-cpf'
																aria-invalid={fieldState.invalid}
																placeholder='000.000.000-00'
																onChange={({ target: { value } }) =>
																	field.onChange(maskCPF(value))
																}
															/>
															{driverMissing && !isCPF(field.value ?? '') && (
																<div
																	role='alert'
																	className='flex flex-row items-start gap-x-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400'
																>
																	<TriangleAlertIcon className='size-3.5 mt-px shrink-0' />
																	{DRIVER_MISSING_MESSAGE}
																</div>
															)}
															{driverName && (
																<FieldDescription className='text-foreground text-xs -mt-2'>
																	{capitalizeFirstLetters(driverName)}
																</FieldDescription>
															)}
														</Field>
													)}
												/>
											</FieldGroup>
											<Separator className='opacity-100 my-4' />
											<FieldGroup className='grid grid-cols-3 gap-2'>
												<Controller
													control={formVehicleConductor.control}
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
													control={formVehicleConductor.control}
													name='percentage'
													render={({ field, fieldState }) => (
														<Field data-invalid={fieldState.invalid}>
															<FieldLabel htmlFor='percentage'>
																Percentual:
															</FieldLabel>
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
																		formVehicleConductor.formState.isValid
																	) {
																		formVehicleConductor.handleSubmit(
																			onSubmitVehicleConductor,
																		)();
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
													<FieldLabel htmlFor='commission'>
														Comissão:
													</FieldLabel>
													<Input
														readOnly
														id='commission'
														value={new Intl.NumberFormat('pt-BR', {
															style: 'currency',
															currency: 'BRL',
														}).format(
															commissionFromAmountAndPercentage(
																amountVehicleConductor,
																percentageVehicleConductor,
															),
														)}
														placeholder='R$ 0,00'
														className='text-left!'
														tabIndex={-1}
														onKeyDown={(e) => {
															if (
																e.code === 'Enter' &&
																formVehicleConductor.formState.isValid
															) {
																formVehicleConductor.handleSubmit(
																	onSubmitVehicleConductor,
																)();
															}
														}}
													/>
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
														<FieldLabel htmlFor='postal-code'>
															CEP de Pernoite:
														</FieldLabel>
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
															<FieldLabel htmlFor='percentage'>
																Percentual:
															</FieldLabel>
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
													<FieldLabel htmlFor='commission'>
														Comissão:
													</FieldLabel>
													<Input
														readOnly
														id='commission'
														value={new Intl.NumberFormat('pt-BR', {
															style: 'currency',
															currency: 'BRL',
														}).format(
															commissionFromAmountAndPercentage(
																amountAddress,
																percentageAddress,
															),
														)}
														placeholder='R$ 0,00'
														className='text-left!'
														tabIndex={-1}
														onKeyDown={(e) => {
															if (
																e.code === 'Enter' &&
																formAddress.formState.isValid
															) {
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
														<FieldLabel htmlFor='franchise'>
															Frânquia:
														</FieldLabel>
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
															<FieldLabel htmlFor='percentage'>
																Percentual:
															</FieldLabel>
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
																		formFranchise.handleSubmit(
																			onSubmitFranchise,
																		)();
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
													<FieldLabel htmlFor='commission'>
														Comissão:
													</FieldLabel>
													<Input
														readOnly
														id='commission'
														value={new Intl.NumberFormat('pt-BR', {
															style: 'currency',
															currency: 'BRL',
														}).format(
															commissionFromAmountAndPercentage(
																amountFranchise,
																percentageFranchise,
															),
														)}
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
										<form
											noValidate
											className='mt-4'
											onKeyDown={handleFormKeyDown}
										>
											<Controller
												control={formCancel.control}
												name='effectivedAt'
												render={({ field, fieldState }) => (
													<Field data-invalid={fieldState.invalid}>
														<FieldLabel>Data de cancelamento:</FieldLabel>
														{/* @ts-ignore */}
														<DatePickerInput
															{...field}
															invalid={fieldState.invalid}
														/>
														{fieldState.invalid && (
															<FieldError errors={[fieldState.error]} />
														)}
													</Field>
												)}
											/>
										</form>
									)}
								</>
							)}
						</Fragment>
					)}
				</div>
				<Separator />
				<DialogFooter>
					<DialogClose>
						<Button variant='destructive' tabIndex={-1}>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button
						type='button'
						isPending={
							isPendingVehicleCondutor ||
							isPendingAddress ||
							isPendingFranchise ||
							isCanceling
						}
						disabled={formIsLocked || !type || !resolvedId}
						onClick={() => {
							if (type === 'vehicle_conductor') {
								formVehicleConductor.handleSubmit(onSubmitVehicleConductor)();
							}

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

export { DialogSafeEndorsementById, DialogSafeEndorsementDetails };
