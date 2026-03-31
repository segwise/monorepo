'use client';

import { SchemaModality, SchemaQuoteStatus } from '@segwise/core/schemas';
import {
	translateModality,
	translateQuoteStatus,
} from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import {
	endOfToday,
	format,
	isSameDay,
	parseISO,
	startOfMonth,
	startOfToday,
} from 'date-fns';
import {
	CarIcon,
	ChevronsUpDownIcon,
	SaveIcon,
	XCircleIcon,
	XIcon,
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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

interface TableFiltersProps {
	type: 'quotes';
	filters: Array<Filter>;
}

function TableFilters({ filters }: TableFiltersProps) {
	const [searchParams, setSearchParams] = useSearchParams();

	const isSearchParams =
		!!searchParams.insuranceCompanies?.length ||
		!!searchParams.modality?.length ||
		!!searchParams.producers?.length ||
		searchParams.renewal === true ||
		searchParams.renewal === false ||
		!searchParams.requestAt
			? false
			: !(
					isSameDay(
						searchParams.requestAt instanceof Date ||
							typeof searchParams.requestAt === 'string'
							? searchParams.requestAt
							: searchParams.requestAt.start,
						startOfMonth(startOfToday()),
					) &&
					isSameDay(
						searchParams.requestAt instanceof Date ||
							typeof searchParams.requestAt === 'string'
							? searchParams.requestAt
							: searchParams.requestAt.end,
						endOfToday(),
					)
				) || !!searchParams.status?.length;

	function getFilter(filter: Filter) {
		return filters.includes(filter);
	}

	function clearSearchParams() {
		setSearchParams({
			producers: null,
			insuranceCompanies: null,
			requestAt: null,
			modality: null,
			status: null,
			renewal: null,
		});
	}

	return (
		<Fragment>
			<Separator orientation='vertical' className='h-7 mx-2' />
			<div className='flex flex-row items-center justify-start gap-x-4 divide-x divide-border/50 *:pr-4'>
				{getFilter('requestAt') && <FilterRequestAt />}
				{getFilter('producers') && <FilterProducers />}
				{getFilter('insuranceCompanies') && <FilterInsuranceCompanies />}
				{getFilter('modality') && <FilterModality />}
				{getFilter('status') && <FilterStatus />}
				{isSearchParams && (
					<Button
						variant='link'
						size='sm'
						className='text-xs [&_svg]:size-3 text-destructive'
						onClick={clearSearchParams}
					>
						<XCircleIcon />
						Limpar tudo
					</Button>
				)}
			</div>
		</Fragment>
	);
}

function TableFiltersCount() {
	const [searchParams] = useSearchParams();

	const isSearchParams = [
		!!searchParams.insuranceCompanies?.length,
		!!searchParams.modality?.length,
		!!searchParams.producers?.length,
		searchParams.renewal === true || searchParams.renewal === false,
		!searchParams.requestAt
			? false
			: !(
					isSameDay(
						searchParams.requestAt instanceof Date ||
							typeof searchParams.requestAt === 'string'
							? searchParams.requestAt
							: searchParams.requestAt.start,
						startOfMonth(startOfToday()),
					) &&
					isSameDay(
						searchParams.requestAt instanceof Date ||
							typeof searchParams.requestAt === 'string'
							? searchParams.requestAt
							: searchParams.requestAt.end,
						endOfToday(),
					)
				),
		!!searchParams.status?.length,
	];

	const count = isSearchParams.filter(Boolean).length;

	if (!count) {
		return;
	}

	return (
		<Badge
			variant='active'
			className='size-4 text-[0.6rem] items-center justify-center pointer-events-none'
		>
			{count}
		</Badge>
	);
}

function FilterRequestAt() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [open, setOpen] = useState<boolean>(false);

	const defaultDate = useMemo(
		() =>
			!searchParams.requestAt
				? {
						from: startOfMonth(startOfToday()),
						to: endOfToday(),
					}
				: typeof searchParams.requestAt === 'string'
					? {
							from: parseISO(searchParams.requestAt),
							to: parseISO(searchParams.requestAt),
						}
					: searchParams.requestAt instanceof Date
						? {
								from: searchParams.requestAt,
								to: searchParams.requestAt,
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
		[searchParams],
	);

	const [date, setDate] = useState<DateRange>(defaultDate);

	const isDateDefault = !searchParams.requestAt
		? true
		: isSameDay(
				searchParams.requestAt instanceof Date ||
					typeof searchParams.requestAt === 'string'
					? searchParams.requestAt
					: searchParams.requestAt.start,
				startOfMonth(startOfToday()),
			) &&
			isSameDay(
				searchParams.requestAt instanceof Date ||
					typeof searchParams.requestAt === 'string'
					? searchParams.requestAt
					: searchParams.requestAt.end,
				endOfToday(),
			);

	function onChange() {
		setSearchParams({
			...(!!date.from && !!date.to && isSameDay(date.from, date.to)
				? {
						requestAt: date.from.toISOString(),
					}
				: {
						...(!!date?.from &&
							!!date.to && {
								requestAt: {
									start: date.from.toISOString(),
									end: date.to.toISOString(),
								},
							}),
						...(!!date?.from &&
							!date.to && {
								requestAt: date.from.toISOString(),
							}),
					}),
		});

		setOpen(false);
	}

	function onReset() {
		setSearchParams({
			requestAt: null,
		});

		setDate(defaultDate);

		setOpen(false);
	}

	useEffect(() => {
		setDate(defaultDate);
	}, [defaultDate]);

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Período:
				{!isDateDefault && (
					<XCircleIcon
						className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive'
						onClick={onReset}
					/>
				)}
			</span>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger>
					<span className='text-muted-foreground truncate cursor-pointer flex flex-row items-center justify-start gap-x-1'>
						{!searchParams.requestAt &&
							`${format(startOfMonth(startOfToday()), 'dd/MM/yyyy')} - ${format(
								endOfToday(),
								'dd/MM/yyyy',
							)}`}
						{!!searchParams.requestAt && (
							<Fragment>
								{typeof searchParams.requestAt === 'string' &&
									format(parseISO(searchParams.requestAt), 'dd/MM/yyyy')}
								{typeof searchParams.requestAt === 'object' &&
									(isSameDay(
										searchParams.requestAt instanceof Date ||
											typeof searchParams.requestAt === 'string'
											? searchParams.requestAt
											: searchParams.requestAt?.start instanceof Date
												? searchParams.requestAt.start
												: (searchParams.requestAt?.start as string),
										searchParams.requestAt instanceof Date ||
											typeof searchParams.requestAt === 'string'
											? searchParams.requestAt
											: searchParams.requestAt?.end instanceof Date
												? searchParams.requestAt.end
												: (searchParams.requestAt?.end as string),
									)
										? format(
												searchParams.requestAt instanceof Date ||
													typeof searchParams.requestAt === 'string'
													? searchParams.requestAt
													: searchParams.requestAt?.start instanceof Date
														? searchParams.requestAt?.start
														: (searchParams.requestAt?.start as string),
												'dd/MM/yyyy',
											)
										: `${format(
												searchParams.requestAt instanceof Date ||
													typeof searchParams.requestAt === 'string'
													? searchParams.requestAt
													: searchParams.requestAt?.start instanceof Date
														? searchParams.requestAt?.start
														: (searchParams.requestAt?.start as string),
												'dd/MM/yyyy',
											)} - ${format(
												searchParams.requestAt instanceof Date ||
													typeof searchParams.requestAt === 'string'
													? searchParams.requestAt
													: searchParams.requestAt?.end instanceof Date
														? searchParams.requestAt?.end
														: (searchParams.requestAt?.end as string),
												'dd/MM/yyyy',
											)}`)}
							</Fragment>
						)}
						<ChevronsUpDownIcon className='size-3' />
					</span>
				</PopoverTrigger>
				<PopoverContent align='start' side='bottom' className='w-auto p-0'>
					<Calendar
						required
						mode='range'
						defaultMonth={
							searchParams.requestAt instanceof Date ||
							typeof searchParams.requestAt === 'string'
								? typeof searchParams.requestAt === 'string'
									? parseISO(searchParams.requestAt)
									: searchParams.requestAt
								: typeof searchParams.requestAt?.start === 'string'
									? parseISO(searchParams.requestAt.start)
									: searchParams.requestAt?.start
						}
						selected={date}
						onSelect={setDate}
						disabled={{
							after: new Date(),
						}}
						numberOfMonths={2}
					/>
					<Separator />
					<div className='flex flex-row items-center justify-between gap-x-2 p-2'>
						{!isDateDefault && (
							<Button
								variant='destructive'
								size='sm'
								onClick={onReset}
								className='flex-1'
							>
								Resetar <XCircleIcon />
							</Button>
						)}
						<Button size='sm' onClick={onChange} className='flex-1'>
							Aplicar <SaveIcon />
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

function FilterProducers() {
	const [searchParams, setSearchParams] = useSearchParams();

	const { data, isPending } = useProducersSimple({
		enabled: !!searchParams.producers?.length,
	});

	const existingItems =
		data?.filter((e) => searchParams.producers?.some((id) => id === e.id)) ||
		[];

	const items =
		data?.filter((e) =>
			existingItems?.slice(0, 2).some(({ id }) => id === e.id),
		) || [];

	const remainingItems =
		data?.filter((e) =>
			existingItems?.slice(2).some(({ id }) => id === e.id),
		) || [];

	function clearSearchParams() {
		setSearchParams({
			producers: null,
		});
	}

	function removeItem(item: string) {
		setSearchParams({
			producers: searchParams.producers?.filter((e) => e !== item) || null,
		});
	}

	if (!searchParams.producers?.length) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Produtor:
				{items.length > 1 && (
					<XCircleIcon
						className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive'
						onClick={clearSearchParams}
					/>
				)}
			</span>
			<div className='flex flex-row items-center justify-start gap-x-2'>
				{isPending
					? Array.from({
							length: searchParams.producers.slice(0, 2).length,
						}).map((_, index) => (
							<div
								key={index.toString()}
								className='flex flex-row items-center justify-start gap-x-1 relative'
							>
								<Skeleton className='size-4 rounded-full' />
								<Skeleton className='w-18 h-3' />
							</div>
						))
					: items?.map((props) => (
							<div
								key={props.id}
								className='text-muted-foreground truncate flex flex-row items-center justify-start gap-x-1 relative line-clamp-1 max-w-28'
							>
								<Avatar className='size-4'>
									<AvatarImage
										src={props?.avatar || placeholder.user}
										width={512}
										height={512}
										alt={capitalizeFirstLetters(props.name.toUpperCase())}
									/>
									<AvatarFallback>
										{props.name.toUpperCase().slice(0, 2)}
									</AvatarFallback>
								</Avatar>
								<span className='truncate flex-1'>
									{capitalizeFirstLetters(props.name)}
								</span>
								<XIcon
									className='size-3 hover:text-foreground cursor-pointer'
									onClick={() => removeItem(props.id)}
								/>
							</div>
						))}
				{!!remainingItems.length && (
					<Popover>
						<PopoverTrigger asChild>
							<Badge className='py-0 cursor-pointer line-clamp-1 truncate'>
								+ {remainingItems.length}
							</Badge>
						</PopoverTrigger>
						<PopoverContent
							align='end'
							className='w-fit px-1.5 py-1 space-y-0.5'
						>
							{remainingItems?.map((props) => (
								<div
									key={props.id}
									className='flex flex-row items-center justify-start gap-x-2 relative rounded cursor-pointer px-1 py-0.5'
								>
									<div className='flex flex-row items-center justify-start gap-x-1.5'>
										<Avatar className='size-4'>
											<AvatarImage
												src={props?.avatar || placeholder.user}
												width={512}
												height={512}
												alt={capitalizeFirstLetters(props.name.toUpperCase())}
											/>
											<AvatarFallback>
												{props.name.toUpperCase().slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										<span className='text-muted-foreground text-xs font-normal'>
											{capitalizeFirstLetters(props.name as string)}
										</span>
									</div>
									<XIcon
										className='size-3 hover:text-destructive cursor-pointer ml-auto'
										onClick={() => removeItem(props.id)}
									/>
								</div>
							))}
						</PopoverContent>
					</Popover>
				)}
			</div>
		</div>
	);
}

function FilterInsuranceCompanies() {
	const [searchParams, setSearchParams] = useSearchParams();

	const { data, isPending } = useInsuranceCompaniesSimple({
		enabled: !!searchParams.insuranceCompanies?.length,
	});

	const items =
		data?.filter((e) =>
			searchParams.insuranceCompanies?.some((id) => id === e.id),
		) || [];

	function clearSearchParams() {
		setSearchParams({
			insuranceCompanies: null,
		});
	}

	function removeItem(item: string) {
		setSearchParams({
			insuranceCompanies:
				searchParams.insuranceCompanies?.filter((e) => e !== item) || null,
		});
	}

	if (!searchParams.insuranceCompanies?.length) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Seguradoras:
				{items.length > 1 && (
					<XCircleIcon
						className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive'
						onClick={clearSearchParams}
					/>
				)}
			</span>
			<div className='flex flex-row items-center justify-start gap-x-2'>
				{isPending
					? Array.from({
							length: searchParams.insuranceCompanies.slice(0, 2).length,
						}).map((_, index) => (
							<div
								key={index.toString()}
								className='flex flex-row items-center justify-start gap-x-1 relative'
							>
								<Skeleton className='size-4 rounded-full' />
								<Skeleton className='w-18 h-3' />
							</div>
						))
					: items.slice(0, 2)?.map((props) => (
							<div
								key={props.id}
								className='text-muted-foreground truncate flex flex-row items-center justify-start gap-x-1 relative line-clamp-1 max-w-28'
							>
								<Avatar className='size-4'>
									<AvatarImage
										src={props?.icon || placeholder.user}
										width={512}
										height={512}
										alt={capitalizeFirstLetters(props.name.toUpperCase())}
									/>
									<AvatarFallback>
										{props.name.toUpperCase().slice(0, 2)}
									</AvatarFallback>
								</Avatar>
								<span className='truncate flex-1'>
									{capitalizeFirstLetters(props.name)}
								</span>
								<XIcon
									className='size-3! hover:text-foreground cursor-pointer'
									onClick={() => removeItem(props.id)}
								/>
							</div>
						))}
				{!!items.slice(2).length && (
					<Popover>
						<PopoverTrigger asChild>
							<Badge className='py-0 cursor-pointer line-clamp-1 truncate'>
								+ {items.slice(2).length}
							</Badge>
						</PopoverTrigger>
						<PopoverContent
							align='end'
							className='w-fit px-1.5 py-1 space-y-0.5'
						>
							{items.slice(2)?.map((props) => (
								<div
									key={props.id}
									className='flex flex-row items-center justify-start gap-x-2 relative rounded cursor-pointer px-1 py-0.5'
								>
									<div className='flex flex-row items-center justify-start gap-x-1.5'>
										<Avatar className='size-4'>
											<AvatarImage
												src={props?.icon || placeholder.user}
												width={512}
												height={512}
												alt={capitalizeFirstLetters(props.name.toUpperCase())}
											/>
											<AvatarFallback>
												{props.name.toUpperCase().slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										<span className='text-muted-foreground text-xs font-normal'>
											{capitalizeFirstLetters(props.name as string)}
										</span>
									</div>
									<XIcon
										className='size-3 hover:text-destructive cursor-pointer ml-auto'
										onClick={() => removeItem(props.id)}
									/>
								</div>
							))}
						</PopoverContent>
					</Popover>
				)}
			</div>
		</div>
	);
}

function FilterModality() {
	const [searchParams, setSearchParams] = useSearchParams();

	const items = SchemaModality.options.filter((id) =>
		searchParams.modality?.some((e) => e === id),
	);

	function clearSearchParams() {
		setSearchParams({
			modality: null,
		});
	}

	function removeItem(item: string) {
		setSearchParams({
			modality: searchParams.modality?.filter((e) => e !== item) || null,
		});
	}

	if (!items.length) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Tipo:
				{items.length > 1 && (
					<XCircleIcon
						onClick={clearSearchParams}
						className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive'
					/>
				)}
			</span>
			<div className='flex flex-row items-center justify-start gap-x-2'>
				{items.slice(0, 2).map((props) => {
					const Icon = props === 'car' ? CarIcon : CarIcon;

					return (
						<Badge key={props} className='font-medium'>
							<Icon className='size-4 stroke-[1.4]' />
							{translateModality(props)}
							<XIcon
								className='size-3! hover:text-destructive cursor-pointer'
								onClick={() => removeItem(props)}
							/>
						</Badge>
					);
				})}
				{!!items.slice(2).length && (
					<Popover>
						<PopoverTrigger asChild>
							<Badge className='cursor-pointer line-clamp-1 truncate'>
								+ {items.slice(2).length}
							</Badge>
						</PopoverTrigger>
						<PopoverContent
							align='end'
							className='w-fit px-1.5 py-1 space-y-0.5'
						>
							{items.slice(2)?.map((props) => (
								<div
									key={props}
									className='flex flex-row items-center justify-start gap-x-2 relative rounded cursor-pointer px-1 py-0.5'
								>
									<div className='flex flex-row items-center justify-start gap-x-1.5'>
										<Avatar className='size-4'>
											<AvatarImage
												src={props || placeholder.user}
												width={512}
												height={512}
												alt={translateModality(props)}
											/>
											<AvatarFallback>
												{translateModality(props).slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										<span className='text-muted-foreground text-xs font-normal'>
											{translateModality(props)}
										</span>
									</div>
									<XIcon
										className='size-3 hover:text-destructive cursor-pointer ml-auto'
										onClick={() => removeItem(props)}
									/>
								</div>
							))}
						</PopoverContent>
					</Popover>
				)}
			</div>
		</div>
	);
}

function FilterStatus() {
	const [searchParams, setSearchParams] = useSearchParams();

	const items = SchemaQuoteStatus.options.filter((id) =>
		searchParams.status?.some((e) => e === id),
	);

	function clearSearchParams() {
		setSearchParams({
			status: null,
		});
	}

	function removeItem(item: string) {
		setSearchParams({
			status: searchParams.status?.filter((e) => e !== item) || null,
		});
	}
	if (!items.length) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Stauts:
				{items.length > 1 && (
					<XCircleIcon
						onClick={clearSearchParams}
						className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive'
					/>
				)}
			</span>
			<div className='flex flex-row items-center justify-start gap-x-2'>
				{items.slice(0, 2).map((props) => (
					<Badge key={props} variant='default' className='font-medium'>
						{translateQuoteStatus(props)}
						<XIcon
							className='size-3! hover:text-destructive cursor-pointer'
							onClick={() => removeItem(props)}
						/>
					</Badge>
				))}
				{!!items.slice(2).length && (
					<Popover>
						<PopoverTrigger asChild>
							<Badge className='cursor-pointer line-clamp-1 truncate'>
								+ {items.slice(2).length}
							</Badge>
						</PopoverTrigger>
						<PopoverContent
							align='end'
							className='w-fit px-1.5 py-1 space-y-0.5'
						>
							{items.slice(2)?.map((props) => (
								<div
									key={props}
									className='flex flex-row items-center justify-start gap-x-2 relative rounded cursor-pointer px-1 py-0.5'
								>
									<div className='flex flex-row items-center justify-start gap-x-1.5'>
										<Avatar className='size-4'>
											<AvatarImage
												src={props || placeholder.user}
												width={512}
												height={512}
												alt={translateQuoteStatus(props)}
											/>
											<AvatarFallback>
												{translateQuoteStatus(props).slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										<span className='text-muted-foreground text-xs font-normal'>
											{translateQuoteStatus(props)}
										</span>
									</div>
									<XIcon
										className='size-3 hover:text-destructive cursor-pointer ml-auto'
										onClick={() => removeItem(props)}
									/>
								</div>
							))}
						</PopoverContent>
					</Popover>
				)}
			</div>
		</div>
	);
}

export { TableFilters, TableFiltersCount };
