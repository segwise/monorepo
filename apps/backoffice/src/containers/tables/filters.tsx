'use client';

import {
	translateModality,
	translateQuoteStatus,
} from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { endOfDay, format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { CarIcon, EditIcon, XCircleIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
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
		!!searchParams.status?.length ||
		!!searchParams.type?.length;

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
			type: null,
		});
	}

	return (
		<Fragment>
			<Separator orientation='vertical' className='h-7 mx-2' />
			<div className='flex flex-row items-center justify-start gap-x-4 divide-x divide-border/50 *:pr-4'>
				{getFilter('producers') && <FilterProducers />}
				{getFilter('insuranceCompanies') && <FilterInsuranceCompanies />}
				{getFilter('requestAt') && <FilterRequestAt />}
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
		searchParams.renewal === true,
		searchParams.renewal === false,
		!!searchParams.status?.length,
		!!searchParams.type?.length,
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

function FilterProducers() {
	const [searchParams] = useSearchParams();

	const { data } = useProducersSimple({
		enabled: !!searchParams.producers?.length,
	});

	if (!searchParams.producers?.length || !data?.length) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Produtor:{' '}
				<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
			</span>
			<span className='text-muted-foreground truncate'>
				{searchParams.producers
					?.map((props) =>
						capitalizeFirstLetters(
							data?.find((e) => e.id === props)?.name as string,
						),
					)
					.join(', ')}
			</span>
		</div>
	);
}

function FilterInsuranceCompanies() {
	const [searchParams] = useSearchParams();

	const { data } = useInsuranceCompaniesSimple({
		enabled: !!searchParams.insuranceCompanies?.length,
	});

	if (!searchParams.insuranceCompanies?.length || !!data?.length) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Seguradoras:
				<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
			</span>
			<div className='flex flex-row items-center justify-start -space-x-1.5'>
				{searchParams.insuranceCompanies?.map((insuranceCompany) => {
					const company = data?.find((e) => e.id === insuranceCompany);

					return (
						<Avatar
							key={company?.id}
							className='size-5 bg-muted not-dark:border not-dark:border-foreground/30 dark:bg-white'
						>
							<AvatarImage
								src={company?.icon as string}
								width={52}
								height={52}
								alt={capitalizeFirstLetters(company?.name as string)}
								priority
							/>
							<AvatarFallback>
								{company?.name.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					);
				})}
			</div>
		</div>
	);
}

function FilterRequestAt() {
	const [open, setOpen] = useState<boolean>(false);

	const [searchParams, setSearchParams] = useSearchParams();

	if (!searchParams.requestAt) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Período:
				<EditIcon
					className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive'
					onClick={() => setOpen((e) => !e)}
				/>
			</span>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger>
					<span className='text-muted-foreground truncate cursor-pointer'>
						{typeof searchParams.requestAt === 'string' &&
							format(parseISO(searchParams.requestAt), 'dd/MM/yyyy')}
						{typeof searchParams.requestAt === 'object' &&
							`${format(parseISO(searchParams.requestAt.start), 'dd/MM/yyyy')} - ${format(parseISO(searchParams.requestAt.end), 'dd/MM/yyyy')}`}
					</span>
				</PopoverTrigger>
				<PopoverContent align='start' side='bottom' className='w-auto p-0'>
					<Calendar
						mode='range'
						defaultMonth={parseISO(
							typeof searchParams.requestAt === 'string'
								? searchParams.requestAt
								: searchParams.requestAt.start,
						)}
						selected={
							typeof searchParams.requestAt === 'string'
								? {
										from: startOfDay(parseISO(searchParams.requestAt)),
									}
								: {
										from: startOfDay(parseISO(searchParams.requestAt.start)),
										to: endOfDay(parseISO(searchParams.requestAt.end)),
									}
						}
						onSelect={(date) => {
							setSearchParams({
								...(!date && {
									requestAt: null,
								}),
								...(!!date && {
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
								}),
							});
						}}
						numberOfMonths={2}
					/>
					<Separator />
					<Button
						onClick={() => [
							setSearchParams({
								requestAt: null,
							}),
							setOpen(false),
						]}
						variant='destructive'
						className='w-full rounded-t-none text-white'
					>
						Resetar <XCircleIcon />
					</Button>
				</PopoverContent>
			</Popover>
		</div>
	);
}

function FilterModality() {
	const [searchParams] = useSearchParams();

	if (!searchParams.modality) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Tipo:
				<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
			</span>
			<div className='flex flex-row items-center justify-start gap-x-2'>
				{searchParams.modality.map((props) => {
					const Icon = props === 'car' ? CarIcon : CarIcon;

					return (
						<Badge key={props} className='font-medium'>
							<Icon className='size-4 stroke-[1.4]' />
							{translateModality(props)}
						</Badge>
					);
				})}
			</div>
		</div>
	);
}

function FilterStatus() {
	const [searchParams] = useSearchParams();

	if (!searchParams.status) {
		return;
	}

	return (
		<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
			<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
				Stauts:
				<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
			</span>
			<div className='flex flex-row items-center justify-start gap-x-2'>
				{searchParams.status.map((props) => {
					const variant: BadgeProps['variant'] =
						props === 'waiting' ? 'warning' : 'default';

					return (
						<Badge key={props} variant={variant} className='font-medium'>
							{translateQuoteStatus(props)}
						</Badge>
					);
				})}
			</div>
		</div>
	);
}

export { TableFilters, TableFiltersCount };
