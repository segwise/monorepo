'use client';

import { SchemaModality, SchemaQuoteStatus } from '@segwise/core/schemas';
import {
	translateModality,
	translateQuoteStatus,
} from '@segwise/core/translate';
import type {
	InsuranceCompanySimple,
	Modality,
	ProducerSimple,
	QuoteStatus,
} from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import {
	endOfDay,
	endOfToday,
	format,
	isSameDay,
	parseISO,
	startOfDay,
	startOfMonth,
	startOfToday,
} from 'date-fns';
import { CalendarIcon, CarIcon, SaveIcon, XCircleIcon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { placeholder } from '@/config/placeholder';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';
import { useProducersSimple } from '@/libraries/hooks/producers/use-producers';
import { useSearchParams } from '@/libraries/search-params/quotes';

type Filter =
	| 'producers'
	| 'insuranceCompanies'
	| 'requestAt'
	| 'modality'
	| 'status';

interface SheetFiltersProps {
	type: 'quotes';
	filters: Array<Filter>;
}

function translate(type: SheetFiltersProps['type']) {
	switch (type) {
		case 'quotes':
			return 'Cotações';
		default:
			return type;
	}
}

function SheetFilters({
	children,
	type,
	filters,
}: React.PropsWithChildren<SheetFiltersProps>) {
	const [open, setOpen] = useState<boolean>(false);

	const [searchParams, setSearchParams] = useSearchParams();

	const defaults = {
		requestAt: !searchParams.requestAt
			? {
					from: startOfMonth(startOfToday()),
					to: endOfToday(),
				}
			: typeof searchParams.requestAt === 'string'
				? {
						from: startOfDay(searchParams.requestAt),
						to: endOfDay(searchParams.requestAt),
					}
				: searchParams.requestAt instanceof Date
					? {
							from: startOfDay(searchParams.requestAt),
							to: endOfDay(searchParams.requestAt),
						}
					: typeof searchParams.requestAt.start === 'string' &&
							typeof searchParams.requestAt.end === 'string'
						? {
								from: parseISO(searchParams.requestAt.start),
								to: parseISO(searchParams.requestAt.end),
							}
						: {
								from: searchParams.requestAt.start as Date,
								to: searchParams.requestAt.end as Date,
							},
		producers: searchParams.producers || [],
		insuranceCompanies: searchParams.insuranceCompanies || [],
		modalities: searchParams.modality || [],
		status: searchParams.status || [],
	};

	const [requestAt, setRequestAt] = useState<DateRange>(defaults.requestAt);
	const [producers, setProducers] = useState<Array<string>>(defaults.producers);
	const [insuranceCompanies, setInsuranceCompanies] = useState<Array<string>>(
		defaults.insuranceCompanies,
	);
	const [modalities, setModalities] = useState<Array<Modality>>(
		defaults.modalities,
	);
	const [status, setStatus] = useState<Array<QuoteStatus>>(defaults.status);

	function onReset() {
		setRequestAt(defaults.requestAt);
		setProducers(defaults.producers);
		setInsuranceCompanies(defaults.insuranceCompanies);
		setModalities(defaults.modalities);
		setStatus(defaults.status);
	}

	function onChangeOpen(open: boolean) {
		setOpen(open);

		if (!open) {
			onReset();
		}
	}

	function applySearchParams() {
		setSearchParams({
			requestAt: !requestAt.to
				? requestAt.from
				: {
						start: requestAt.from as Date,
						end: requestAt.to as Date,
					},
			producers: producers.length ? producers : null,
			insuranceCompanies: insuranceCompanies.length ? insuranceCompanies : null,
			modality: modalities.length ? modalities : null,
			status: status.length ? status : null,
		});

		setOpen(false);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: useEffect
	useEffect(() => {
		onReset();
	}, [searchParams]);

	return (
		<Sheet open={open} onOpenChange={onChangeOpen} modal={false}>
			<SheetTrigger asChild>{children}</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Filtrar {translate(type)}</SheetTitle>
					<SheetDescription>Consulta avançada de registros</SheetDescription>
				</SheetHeader>
				<Separator />
				<div className='px-4 space-y-3'>
					{filters.includes('requestAt') && (
						<FilterRequestAt value={requestAt} onChange={setRequestAt} />
					)}
					{filters.includes('producers') && (
						<FilterProducers value={producers} onChange={setProducers} />
					)}
					{filters.includes('insuranceCompanies') && (
						<FilterInsuranceCompanies
							value={insuranceCompanies}
							onChange={setInsuranceCompanies}
						/>
					)}
					{filters.includes('modality') && (
						<FilterModality value={modalities} onChange={setModalities} />
					)}
					{filters.includes('status') && (
						<FilterStatus value={status} onChange={setStatus} />
					)}
				</div>
				<SheetFooter>
					<Button onClick={applySearchParams}>
						Aplicar <SaveIcon />
					</Button>
					<SheetClose asChild>
						<Button variant='destructive'>
							Fechar <XCircleIcon />
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

function FilterRequestAt({
	value,
	onChange,
}: {
	value: DateRange;
	onChange: (value: DateRange) => void;
}) {
	const [open, setOpen] = useState<boolean>(false);

	const [searchParams] = useSearchParams();

	const defaultDate = !searchParams.requestAt
		? {
				from: startOfMonth(startOfToday()),
				to: endOfToday(),
			}
		: typeof searchParams.requestAt === 'string'
			? {
					from: startOfDay(searchParams.requestAt),
					to: endOfDay(searchParams.requestAt),
				}
			: searchParams.requestAt instanceof Date
				? {
						from: startOfDay(searchParams.requestAt),
						to: endOfDay(searchParams.requestAt),
					}
				: searchParams.requestAt.start instanceof Date &&
						searchParams.requestAt.end instanceof Date
					? {
							from: searchParams.requestAt.start,
							to: searchParams.requestAt.end,
						}
					: {
							from: parseISO(searchParams.requestAt.start as string),
							to: parseISO(searchParams.requestAt.end as string),
						};

	const isDateDefault =
		value.from &&
		isSameDay(value.from, startOfMonth(startOfToday())) &&
		value.to &&
		isSameDay(value.to, endOfToday());

	function onReset() {
		onChange(defaultDate);

		setOpen(false);
	}

	return (
		<Field>
			<FieldLabel>Data de Solicitação</FieldLabel>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						className='justify-start px-2.5 font-normal'
					>
						<CalendarIcon />
						{value?.from ? (
							value.to ? (
								isSameDay(value.from, value.to) ? (
									capitalizeFirstLetters(format(value.from, "dd 'de' LLLL, y"))
								) : (
									<>
										{capitalizeFirstLetters(
											format(value.from, "dd 'de' LLLL, y"),
										)}{' '}
										-{' '}
										{capitalizeFirstLetters(
											format(value.to, "dd 'de' LLLL, y"),
										)}
									</>
								)
							) : (
								capitalizeFirstLetters(format(value.from, "dd 'de' LLLL, y"))
							)
						) : (
							<span>Selecionar Data</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='end'>
					<Calendar
						required
						mode='range'
						defaultMonth={value?.from}
						selected={value}
						onSelect={({ from, to }) =>
							onChange({
								from: startOfDay(from as Date),
								...(!!to && {
									to: endOfDay(to),
								}),
							})
						}
						numberOfMonths={2}
						disabled={{
							after: new Date(),
						}}
					/>
					{!isDateDefault && (
						<Fragment>
							<Separator />
							<div className='flex flex-row items-center justify-between gap-x-2 p-2'>
								<Button
									variant='destructive'
									size='sm'
									onClick={onReset}
									className='flex-1'
								>
									Limpar <XCircleIcon />
								</Button>
							</div>
						</Fragment>
					)}
				</PopoverContent>
			</Popover>
		</Field>
	);
}

function FilterProducers({
	value,
	onChange,
}: {
	value: Array<string>;
	onChange: (value: Array<string>) => void;
}) {
	const { data } = useProducersSimple();

	const anchor = useComboboxAnchor();

	function onReset() {
		onChange([]);
	}

	return (
		<Field>
			<FieldLabel>Produtores</FieldLabel>
			<Combobox
				multiple
				autoHighlight
				items={data}
				value={value}
				onValueChange={onChange}
			>
				<ComboboxChips ref={anchor} className='w-full max-w-xs'>
					<ComboboxValue>
						{(values: Array<string>) => (
							<Fragment>
								{values.map((value) => (
									<ComboboxChip key={value}>
										<Avatar className='size-4'>
											<AvatarImage
												src={
													data?.find((e) => e.id === value)?.avatar ||
													placeholder.user
												}
												width={512}
												height={512}
												alt={capitalizeFirstLetters(
													data
														?.find((e) => e.id === value)
														?.name.toUpperCase() as string,
												)}
											/>
											<AvatarFallback>
												{data
													?.find((e) => e.id === value)
													?.name.toUpperCase()
													.slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										{capitalizeFirstLetters(
											data?.find((e) => e.id === value)?.name as string,
										)}
									</ComboboxChip>
								))}
								<ComboboxChipsInput placeholder='Selecionar Produtores' />
							</Fragment>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent anchor={anchor} align='end'>
					<ComboboxEmpty>Nenhum registro encontrado</ComboboxEmpty>
					<ComboboxList>
						{(item: ProducerSimple) => (
							<ComboboxItem key={item.id} value={item.id}>
								<Avatar className='size-6'>
									<AvatarImage
										src={item.avatar || placeholder.user}
										width={512}
										height={512}
										alt={capitalizeFirstLetters(item.name)}
									/>
									<AvatarFallback>
										{item.name.toUpperCase().slice(0, 2)}
									</AvatarFallback>
								</Avatar>
								{capitalizeFirstLetters(item.name)}
							</ComboboxItem>
						)}
					</ComboboxList>
					{!!value.length && (
						<Fragment>
							<Separator />
							<div className='my-2 mx-2'>
								<Button
									variant='destructive'
									size='sm'
									onClick={onReset}
									className='w-full'
								>
									Limpar <XCircleIcon />
								</Button>
							</div>
						</Fragment>
					)}
				</ComboboxContent>
			</Combobox>
		</Field>
	);
}

function FilterInsuranceCompanies({
	value,
	onChange,
}: {
	value: Array<string>;
	onChange: (value: Array<string>) => void;
}) {
	const { data } = useInsuranceCompaniesSimple();

	const anchor = useComboboxAnchor();

	function onReset() {
		onChange([]);
	}

	return (
		<Field>
			<FieldLabel>Seguradoras</FieldLabel>
			<Combobox
				multiple
				autoHighlight
				items={data}
				value={value}
				onValueChange={onChange}
			>
				<ComboboxChips ref={anchor} className='w-full max-w-xs'>
					<ComboboxValue>
						{(values: Array<string>) => (
							<Fragment>
								{values.map((value) => (
									<ComboboxChip key={value}>
										<Avatar className='size-4'>
											<AvatarImage
												src={
													data?.find((e) => e.id === value)?.icon ||
													placeholder.company
												}
												width={512}
												height={512}
												alt={capitalizeFirstLetters(
													data
														?.find((e) => e.id === value)
														?.name.toUpperCase() as string,
												).replace('S/a', 'S/A')}
											/>
											<AvatarFallback>
												{data
													?.find((e) => e.id === value)
													?.name.toUpperCase()
													.slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										{capitalizeFirstLetters(
											data?.find((e) => e.id === value)?.name as string,
										).replace('S/a', 'S/A')}
									</ComboboxChip>
								))}
								<ComboboxChipsInput placeholder='Selecionar Seguradoras' />
							</Fragment>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent anchor={anchor} align='end'>
					<ComboboxEmpty>Nenhum registro encontrado</ComboboxEmpty>
					<ComboboxList>
						{(item: InsuranceCompanySimple) => (
							<ComboboxItem key={item.id} value={item.id}>
								<Avatar className='size-6'>
									<AvatarImage
										src={item.icon || placeholder.company}
										width={512}
										height={512}
										alt={capitalizeFirstLetters(item.name).replace(
											'S/a',
											'S/A',
										)}
									/>
									<AvatarFallback>
										{item.name.toUpperCase().slice(0, 2)}
									</AvatarFallback>
								</Avatar>
								{capitalizeFirstLetters(item.name).replace('S/a', 'S/A')}
							</ComboboxItem>
						)}
					</ComboboxList>
					{!!value.length && (
						<Fragment>
							<Separator />
							<div className='my-2 mx-2'>
								<Button
									variant='destructive'
									size='sm'
									onClick={onReset}
									className='w-full'
								>
									Limpar <XCircleIcon />
								</Button>
							</div>
						</Fragment>
					)}
				</ComboboxContent>
			</Combobox>
		</Field>
	);
}

function FilterModality({
	value,
	onChange,
}: {
	value: Array<Modality>;
	onChange: (value: Array<Modality>) => void;
}) {
	const anchor = useComboboxAnchor();

	function onReset() {
		onChange([]);
	}

	return (
		<Field>
			<FieldLabel>Modalidade</FieldLabel>
			<Combobox
				multiple
				autoHighlight
				items={SchemaModality.options}
				value={value}
				onValueChange={onChange}
			>
				<ComboboxChips ref={anchor} className='w-full max-w-xs'>
					<ComboboxValue>
						{(values: Array<Modality>) => (
							<Fragment>
								{values.map((value) => (
									<ComboboxChip key={value}>
										{value === 'car' && <CarIcon className='size-4' />}
										{translateModality(value)}
									</ComboboxChip>
								))}
								<ComboboxChipsInput placeholder='Selecionar Modalidade' />
							</Fragment>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent anchor={anchor}>
					<ComboboxEmpty>Nenhum registro encontrado</ComboboxEmpty>
					<ComboboxList>
						{(item: Modality) => (
							<ComboboxItem key={item} value={item}>
								{item === 'car' && <CarIcon className='size-5 stroke-[1.5]' />}
								{translateModality(item)}
							</ComboboxItem>
						)}
					</ComboboxList>
					{!!value.length && (
						<Fragment>
							<Separator />
							<div className='my-2 mx-2'>
								<Button
									variant='destructive'
									size='sm'
									onClick={onReset}
									className='w-full'
								>
									Limpar <XCircleIcon />
								</Button>
							</div>
						</Fragment>
					)}
				</ComboboxContent>
			</Combobox>
		</Field>
	);
}

function FilterStatus({
	value,
	onChange,
}: {
	value: Array<QuoteStatus>;
	onChange: (value: Array<QuoteStatus>) => void;
}) {
	const anchor = useComboboxAnchor();

	function onReset() {
		onChange([]);
	}

	return (
		<Field>
			<FieldLabel>Status</FieldLabel>
			<Combobox
				multiple
				autoHighlight
				items={SchemaQuoteStatus.options}
				value={value}
				onValueChange={onChange}
			>
				<ComboboxChips ref={anchor} className='w-full max-w-xs'>
					<ComboboxValue>
						{(values: Array<QuoteStatus>) => (
							<Fragment>
								{values.map((value) => (
									<ComboboxChip key={value}>
										{translateQuoteStatus(value)}
									</ComboboxChip>
								))}
								<ComboboxChipsInput placeholder='Selecionar Status' />
							</Fragment>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent anchor={anchor}>
					<ComboboxEmpty>Nenhum registro encontrado</ComboboxEmpty>
					<ComboboxList>
						{(item: QuoteStatus) => (
							<ComboboxItem key={item} value={item}>
								{translateQuoteStatus(item)}
							</ComboboxItem>
						)}
					</ComboboxList>
					{!!value.length && (
						<Fragment>
							<Separator />
							<div className='my-2 mx-2'>
								<Button
									variant='destructive'
									size='sm'
									onClick={onReset}
									className='w-full'
								>
									Limpar <XCircleIcon />
								</Button>
							</div>
						</Fragment>
					)}
				</ComboboxContent>
			</Combobox>
		</Field>
	);
}

export { SheetFilters };
