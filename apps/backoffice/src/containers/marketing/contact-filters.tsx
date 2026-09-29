'use client';

import { format, isSameDay, parse } from 'date-fns';
import { CalendarIcon, SaveIcon, XCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
	CONTACT_STATUSES,
	useContactSearchParams,
} from '@/libraries/search-params/marketing';
import { STATUS_BADGE, STATUS_DATE_LABEL } from './contact-status';
import { FilterBadge } from './filter-badge';

type Status = (typeof CONTACT_STATUSES)[number] | 'all';

function MarketingContactFilters({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);
	const [searchParams, setSearchParams] = useContactSearchParams();

	const defaults = {
		status: (searchParams.status || 'all') as Status,
		from: searchParams.from || '',
		to: searchParams.to || '',
	};

	const [status, setStatus] = useState<Status>(defaults.status);
	const [from, setFrom] = useState<string>(defaults.from);
	const [to, setTo] = useState<string>(defaults.to);

	const range = from
		? {
				from: parse(from, 'yyyy-MM-dd', new Date()),
				...(to && { to: parse(to, 'yyyy-MM-dd', new Date()) }),
			}
		: undefined;

	function onReset() {
		setStatus(defaults.status);
		setFrom(defaults.from);
		setTo(defaults.to);
	}

	function onChangeOpen(next: boolean) {
		setOpen(next);

		if (!next) {
			onReset();
		}
	}

	function onChangeStatus(next: Status) {
		setStatus(next);

		// "Não enviado" não tem data: o filtro de data não se aplica.
		if (next === 'never') {
			setFrom('');
			setTo('');
		}
	}

	function onApply() {
		setSearchParams({
			status: status === 'all' ? null : status,
			from: from || null,
			to: to || null,
		});

		setOpen(false);
	}

	function onClear() {
		setSearchParams({ status: null, from: null, to: null });
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
					<SheetTitle>Filtrar Contatos</SheetTitle>
					<SheetDescription>Consulta avançada de registros</SheetDescription>
				</SheetHeader>
				<Separator />
				<div className='px-4 space-y-3 overflow-auto'>
					<Field>
						<FieldLabel>Status do envio</FieldLabel>
						<div className='flex flex-wrap gap-1.5'>
							<FilterBadge
								active={status === 'all'}
								onClick={() => onChangeStatus('all')}
							>
								Todos
							</FilterBadge>
							{CONTACT_STATUSES.map((item) => (
								<FilterBadge
									key={item}
									active={status === item}
									onClick={() => onChangeStatus(item)}
								>
									{STATUS_BADGE[item].label}
								</FilterBadge>
							))}
						</div>
					</Field>
					{status !== 'never' && (
						<Field>
							<FieldLabel>{STATUS_DATE_LABEL[status]}</FieldLabel>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className='justify-start px-2.5 font-normal'
									>
										<CalendarIcon />
										{range?.from ? (
											range.to && !isSameDay(range.from, range.to) ? (
												<>
													{format(range.from, 'dd/MM/yyyy')} -{' '}
													{format(range.to, 'dd/MM/yyyy')}
												</>
											) : (
												format(range.from, 'dd/MM/yyyy')
											)
										) : (
											<span>Selecionar Data</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0' align='end'>
									<Calendar
										skipYear
										mode='range'
										{...(range?.from && { defaultMonth: range.from })}
										selected={range}
										onSelect={(next) => {
											setFrom(
												next?.from ? format(next.from, 'yyyy-MM-dd') : '',
											);
											setTo(next?.to ? format(next.to, 'yyyy-MM-dd') : '');
										}}
										numberOfMonths={2}
									/>
									{!!from && (
										<>
											<Separator />
											<div className='p-2'>
												<Button
													variant='destructive'
													size='sm'
													className='w-full'
													onClick={() => {
														setFrom('');
														setTo('');
													}}
												>
													Limpar <XCircleIcon />
												</Button>
											</div>
										</>
									)}
								</PopoverContent>
							</Popover>
						</Field>
					)}
				</div>
				<SheetFooter>
					<Button onClick={onApply}>
						Aplicar <SaveIcon />
					</Button>
					<Button variant='outline' onClick={onClear}>
						Limpar filtros
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

function MarketingContactFiltersCount() {
	const [searchParams] = useContactSearchParams();

	const count = [
		searchParams.status,
		searchParams.from || searchParams.to,
	].filter(Boolean).length;

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

export { MarketingContactFilters, MarketingContactFiltersCount };
