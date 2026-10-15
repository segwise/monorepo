'use client';

import type { ProducerPendingKind } from '@segwise/core/types';
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
import { useSearchParams } from '@/libraries/search-params/producers';

type Status = 'all' | 'active' | 'suspended' | 'pending';
type Kind = ProducerPendingKind | 'all';

function TableProducersSheetFilters({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);

	const [searchParams, setSearchParams] = useSearchParams();

	const defaults = {
		status: (searchParams.status || 'all') as Status,
		kind: (searchParams.kind || 'all') as Kind,
		from: searchParams.from || '',
		to: searchParams.to || '',
	};

	const [status, setStatus] = useState<Status>(defaults.status);
	const [kind, setKind] = useState<Kind>(defaults.kind);
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
		setKind(defaults.kind);
		setFrom(defaults.from);
		setTo(defaults.to);
	}

	function onChangeOpen(open: boolean) {
		setOpen(open);

		if (!open) {
			onReset();
		}
	}

	function clearSearchParams() {
		setSearchParams({
			status: null,
			kind: null,
			from: null,
			to: null,
			cursor: null,
		});

		setOpen(false);
	}

	function applySearchParams() {
		setSearchParams({
			status: status === 'all' ? null : status,
			kind: kind === 'all' ? null : kind,
			from: from || null,
			to: to || null,
			cursor: null,
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
					<SheetTitle>Filtrar Produtores</SheetTitle>
					<SheetDescription>Consulta avançada de registros</SheetDescription>
				</SheetHeader>
				<Separator />
				<div className='px-4 space-y-3 overflow-auto'>
					<Field>
						<FieldLabel>Status</FieldLabel>
						<div className='flex flex-wrap gap-1.5'>
							{(
								[
									['all', 'Todos'],
									['active', 'Ativos'],
									['suspended', 'Suspensos'],
									['pending', 'Pendentes'],
								] as const
							).map(([value, label]) => (
								<Badge
									key={value}
									variant={status === value ? 'active' : 'default'}
									className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
									onClick={() => setStatus(value)}
								>
									{label}
								</Badge>
							))}
						</div>
					</Field>
					<Field>
						<FieldLabel>Tipo</FieldLabel>
						<div className='space-x-1.5'>
							<Badge
								variant={kind === 'all' ? 'active' : 'default'}
								className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
								onClick={() => setKind('all')}
							>
								Todos
							</Badge>
							<Badge
								variant={kind === 'partner' ? 'active' : 'default'}
								className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
								onClick={() => setKind('partner')}
							>
								Parceiros
							</Badge>
							<Badge
								variant={kind === 'producer' ? 'active' : 'default'}
								className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
								onClick={() => setKind('producer')}
							>
								Produtores
							</Badge>
						</div>
					</Field>
					<Field>
						<FieldLabel>
							{status === 'pending'
								? 'Data do convite'
								: status === 'all'
									? 'Data de início ou convite'
									: 'Data de início'}
						</FieldLabel>
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
										setFrom(next?.from ? format(next.from, 'yyyy-MM-dd') : '');
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
				</div>
				<SheetFooter>
					<Button onClick={applySearchParams}>
						Aplicar <SaveIcon />
					</Button>
					<Button variant='outline' onClick={clearSearchParams}>
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

function TableProducersSheetFiltersCount() {
	const [searchParams] = useSearchParams();

	const count = [
		!!searchParams.status && searchParams.status !== 'all',
		!!searchParams.kind && searchParams.kind !== 'all',
		!!searchParams.from || !!searchParams.to,
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

// "Limpar tudo" na barra de busca, como nas propostas: só aparece com filtro ativo.
function TableProducersClearFilters() {
	const [searchParams, setSearchParams] = useSearchParams();

	const isActive =
		(!!searchParams.status && searchParams.status !== 'all') ||
		(!!searchParams.kind && searchParams.kind !== 'all') ||
		!!searchParams.from ||
		!!searchParams.to;

	if (!isActive) {
		return;
	}

	return (
		<Button
			variant='link'
			size='sm'
			className='text-xs [&_svg]:size-3 text-destructive'
			onClick={() =>
				setSearchParams({
					status: null,
					kind: null,
					from: null,
					to: null,
					cursor: null,
				})
			}
		>
			<XCircleIcon />
			Limpar tudo
		</Button>
	);
}

export {
	TableProducersClearFilters,
	TableProducersSheetFilters,
	TableProducersSheetFiltersCount,
};
