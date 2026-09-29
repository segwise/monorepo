'use client';

import type { ProducerPendingKind } from '@segwise/core/types';
import { SaveIcon, XCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
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

type Status = 'active' | 'pending';
type Kind = ProducerPendingKind | 'all';

function TableProducersSheetFilters({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);

	const [searchParams, setSearchParams] = useSearchParams();

	const defaults = {
		status: (searchParams.status || 'active') as Status,
		kind: (searchParams.kind || 'all') as Kind,
	};

	const [status, setStatus] = useState<Status>(defaults.status);
	const [kind, setKind] = useState<Kind>(defaults.kind);

	function onReset() {
		setStatus(defaults.status);
		setKind(defaults.kind);
	}

	function onChangeOpen(open: boolean) {
		setOpen(open);

		if (!open) {
			onReset();
		}
	}

	function applySearchParams() {
		setSearchParams({
			status: status === 'active' ? null : status,
			kind: kind === 'all' ? null : kind,
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
						<div className='space-x-1.5'>
							<Badge
								variant={status === 'active' ? 'active' : 'default'}
								className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
								onClick={() => setStatus('active')}
							>
								Ativos
							</Badge>
							<Badge
								variant={status === 'pending' ? 'active' : 'default'}
								className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
								onClick={() => setStatus('pending')}
							>
								Pendentes
							</Badge>
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

function TableProducersSheetFiltersCount() {
	const [searchParams] = useSearchParams();

	const count = [
		searchParams.status === 'pending',
		!!searchParams.kind && searchParams.kind !== 'all',
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

export { TableProducersSheetFilters, TableProducersSheetFiltersCount };
