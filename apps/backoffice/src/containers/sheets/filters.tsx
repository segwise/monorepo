'use client';

import type { ProducerSimple } from '@segwise/core/types';
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
import { CalendarIcon, SaveIcon, XCircleIcon } from 'lucide-react';
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
		requestAt:
			typeof searchParams.requestAt === 'string'
				? {
						from: startOfDay(parseISO(searchParams.requestAt)),
					}
				: {
						from: startOfDay(parseISO(searchParams.requestAt.start)),
						to: endOfDay(parseISO(searchParams.requestAt.end)),
					},
		producers: searchParams.producers || [],
	};

	const [requestAt, setRequestAt] = useState<DateRange>(defaults.requestAt);
	const [producers, setProducers] = useState<Array<string>>(defaults.producers);

	function onReset() {
		setRequestAt(defaults.requestAt);
		setProducers(defaults.producers);
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
				? (requestAt.from?.toISOString() as string)
				: {
						start: requestAt.from?.toISOString() as string,
						end: requestAt.to.toISOString() as string,
					},
			producers: producers.length > 0 ? producers : null,
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

	const defaultDate =
		typeof searchParams.requestAt === 'string'
			? {
					from: startOfDay(parseISO(searchParams.requestAt)),
				}
			: {
					from: startOfDay(parseISO(searchParams.requestAt.start)),
					to: endOfDay(parseISO(searchParams.requestAt.end)),
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
						onSelect={onChange}
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
								<ComboboxChipsInput placeholder='Selecionar Produtor' />
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

export { SheetFilters };
