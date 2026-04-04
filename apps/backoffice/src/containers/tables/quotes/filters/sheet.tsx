'use client';

import { maskCNPJ } from '@segwise/core/masks';
import { SchemaModality, SchemaQuoteStatus } from '@segwise/core/schemas';
import {
	translateModality,
	translateQuoteStatus,
} from '@segwise/core/translate';
import type {
	BrokerSimple,
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
import {
	CalendarIcon,
	CarIcon,
	SaveIcon,
	XCircleIcon,
	XIcon,
} from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { useBrokersSimple } from '@/libraries/hooks/brokers/use-brokers';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';
import { useProducersSimple } from '@/libraries/hooks/producers/use-producers';
import { useSearchParams } from '@/libraries/search-params/quotes';

function TableQuotesSheetFilters({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);

	const [searchParams, setSearchParams] = useSearchParams();

	const defaults = {
		requestedAt: !searchParams.requestedAt
			? {
					from: startOfMonth(startOfToday()),
					to: endOfToday(),
				}
			: typeof searchParams.requestedAt === 'string'
				? {
						from: startOfDay(searchParams.requestedAt),
						to: endOfDay(searchParams.requestedAt),
					}
				: searchParams.requestedAt instanceof Date
					? {
							from: startOfDay(searchParams.requestedAt),
							to: endOfDay(searchParams.requestedAt),
						}
					: typeof searchParams.requestedAt.start === 'string' &&
							typeof searchParams.requestedAt.end === 'string'
						? {
								from: parseISO(searchParams.requestedAt.start),
								to: parseISO(searchParams.requestedAt.end),
							}
						: {
								from: searchParams.requestedAt.start as Date,
								to: searchParams.requestedAt.end as Date,
							},
		producers: searchParams.producers || [],
		insuranceCompanies: searchParams.insuranceCompanies || [],
		brokers: searchParams.brokers || [],
		modalities: searchParams.modality || [],
		status: searchParams.status || [],
	};

	const [requestedAt, setrequestedAt] = useState<DateRange>(
		defaults.requestedAt,
	);
	const [producers, setProducers] = useState<Array<string>>(defaults.producers);
	const [insuranceCompanies, setInsuranceCompanies] = useState<Array<string>>(
		defaults.insuranceCompanies,
	);
	const [brokers, setBrokers] = useState<Array<string>>(defaults.brokers);
	const [modalities, setModalities] = useState<Array<Modality>>(
		defaults.modalities,
	);
	const [status, setStatus] = useState<Array<QuoteStatus>>(defaults.status);

	function onReset() {
		setrequestedAt(defaults.requestedAt);
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
			requestedAt: !requestedAt.to
				? requestedAt.from
				: isSameDay(requestedAt.from as Date, startOfMonth(startOfToday())) &&
						isSameDay(requestedAt.to as Date, endOfToday())
					? null
					: {
							start: requestedAt.from as Date,
							end: requestedAt.to as Date,
						},
			producers: producers.length ? producers : null,
			insuranceCompanies: insuranceCompanies.length ? insuranceCompanies : null,
			brokers: brokers.length ? brokers : null,
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
					<SheetTitle>Filtrar Cotações</SheetTitle>
					<SheetDescription>Consulta avançada de registros</SheetDescription>
				</SheetHeader>
				<Separator />
				<div className='px-4 space-y-3'>
					<FilterrequestedAt value={requestedAt} onChange={setrequestedAt} />
					<FilterProducers value={producers} onChange={setProducers} />
					<FilterInsuranceCompanies
						value={insuranceCompanies}
						onChange={setInsuranceCompanies}
					/>
					{process.env.NEXT_PUBLIC_ROLE_SYSTEM === 'admin' && (
						<FilterBrokers value={brokers} onChange={setBrokers} />
					)}
					<FilterModality value={modalities} onChange={setModalities} />
					<FilterStatus value={status} onChange={setStatus} />
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

function FilterrequestedAt({
	value,
	onChange,
}: {
	value: DateRange;
	onChange: (value: DateRange) => void;
}) {
	const [open, setOpen] = useState<boolean>(false);

	const [searchParams] = useSearchParams();

	const defaultDate = !searchParams.requestedAt
		? {
				from: startOfMonth(startOfToday()),
				to: endOfToday(),
			}
		: typeof searchParams.requestedAt === 'string'
			? {
					from: startOfDay(searchParams.requestedAt),
					to: endOfDay(searchParams.requestedAt),
				}
			: searchParams.requestedAt instanceof Date
				? {
						from: startOfDay(searchParams.requestedAt),
						to: endOfDay(searchParams.requestedAt),
					}
				: searchParams.requestedAt.start instanceof Date &&
						searchParams.requestedAt.end instanceof Date
					? {
							from: searchParams.requestedAt.start,
							to: searchParams.requestedAt.end,
						}
					: {
							from: parseISO(searchParams.requestedAt.start as string),
							to: parseISO(searchParams.requestedAt.end as string),
						};

	const isDateDefault =
		value.from &&
		isSameDay(value.from, startOfMonth(startOfToday())) &&
		value.to &&
		isSameDay(value.to, endOfToday());

	function onReset() {
		onChange({
			from: startOfMonth(startOfToday()),
			to: endOfToday(),
		});

		setOpen(false);
	}

	function onClear() {
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
									onClick={onClear}
									className='flex-1'
								>
									Limpar <XCircleIcon />
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={onReset}
									className='flex-1'
								>
									Resetar <XCircleIcon />
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

	if (!data?.length) {
		return;
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

	if (!data?.length) {
		return;
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
												)
													.replace('S/a', 'S/A')
													.replace('Ltda', 'LTDA')}
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
										)
											.replace('S/a', 'S/A')
											.replace('Ltda', 'LTDA')}
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
								{capitalizeFirstLetters(item.name)
									.replace('S/a', 'S/A')
									.replace('Ltda', 'LTDA')}
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

function FilterBrokers({
	value,
	onChange,
}: {
	value: Array<string>;
	onChange: (value: Array<string>) => void;
}) {
	const { data } = useBrokersSimple();

	const anchor = useComboboxAnchor();

	function onReset() {
		onChange([]);
	}

	if (!data?.length) {
		return;
	}

	return (
		<Field>
			<FieldLabel>Corretoras</FieldLabel>
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
												)
													.replace('S/a', 'S/A')
													.replace('Ltda', 'LTDA')}
											/>
											<AvatarFallback>
												{data
													?.find((e) => e.id === value)
													?.name.toUpperCase()
													.slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										{capitalizeFirstLetters(
											(data?.find((e) => e.id === value)?.fantasy as string) ||
												(data?.find((e) => e.id === value)?.name as string),
										)
											.replace('S/a', 'S/A')
											.replace('Ltda', 'LTDA')}
									</ComboboxChip>
								))}
								<ComboboxChipsInput placeholder='Selecionar Corretora' />
							</Fragment>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent anchor={anchor} align='end'>
					<ComboboxEmpty>Nenhum registro encontrado</ComboboxEmpty>
					<ComboboxList>
						{(item: BrokerSimple) => (
							<ComboboxItem key={item.id} value={item.id} className='py-1.5'>
								<Avatar className='size-6'>
									<AvatarImage
										src={item.icon || placeholder.company}
										width={512}
										height={512}
										alt={capitalizeFirstLetters(item.name)
											.replace('S/a', 'S/A')
											.replace('Ltda', 'LTDA')}
									/>
									<AvatarFallback>
										{item.name.toUpperCase().slice(0, 2)}
									</AvatarFallback>
								</Avatar>
								<div>
									<span className='block text-inherit text-sm font-medium leading-none mb-0.5'>
										{capitalizeFirstLetters(item?.fantasy || item.name)
											.replace('S/a', 'S/A')
											.replace('Ltda', 'LTDA')}
									</span>
									<span className='block text-muted-foreground text-xs text-[10px] leading-none'>
										{maskCNPJ(item.cnpj)}
									</span>
								</div>
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
	function onChangeValue(modality: Modality) {
		if (value.includes(modality)) {
			onChange(value.filter((e) => e !== modality));
		} else {
			onChange([...value, modality]);
		}
	}

	return (
		<Field>
			<FieldLabel>Modalidade</FieldLabel>
			<div>
				{SchemaModality.options.map((modality) => (
					<Badge
						key={modality}
						variant={!value.includes(modality) ? 'default' : 'active'}
						className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
						onClick={() => onChangeValue(modality)}
					>
						{modality === 'car' && <CarIcon />}
						{translateModality(modality)}{' '}
						{value.includes(modality) && <XIcon className='size-2.5!' />}
					</Badge>
				))}
			</div>
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
	function onChangeValue(status: QuoteStatus) {
		if (value.includes(status)) {
			onChange(value.filter((e) => e !== status));
		} else {
			onChange([...value, status]);
		}
	}

	return (
		<Field>
			<FieldLabel>Status</FieldLabel>
			<div className=' flex-wrap space-x-1.5 space-y-1'>
				{SchemaQuoteStatus.options.map((status) => (
					<Badge
						key={status}
						variant={!value.includes(status) ? 'default' : 'active'}
						className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
						onClick={() => onChangeValue(status)}
					>
						{translateQuoteStatus(status)}{' '}
						{value.includes(status) && <XIcon className='size-2.5!' />}
					</Badge>
				))}
			</div>
		</Field>
	);
}

export { TableQuotesSheetFilters };
