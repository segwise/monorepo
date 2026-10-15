'use client';

import type { StaffRole } from '@segwise/core';
import { translateStaffRole } from '@segwise/core/translate';
import { STAFF_ROLES } from '@segwise/core/utils';
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
import { FilterBadge } from '@/containers/marketing/filter-badge';
import { useUsersSearchParams } from '@/libraries/search-params/users';

type Role = StaffRole | 'all';
type Status = 'all' | 'active' | 'suspended' | 'deleted' | 'pending';

const STATUS_LABEL: Array<[Status, string]> = [
	['all', 'Todos (sem excluídos)'],
	['active', 'Ativos'],
	['suspended', 'Suspensos'],
	['deleted', 'Excluídos'],
	['pending', 'Convite pendente'],
];

function UsersFilters({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);
	const [searchParams, setSearchParams] = useUsersSearchParams();

	const defaults = {
		role: (searchParams.role || 'all') as Role,
		status: (searchParams.status || 'all') as Status,
	};

	const [role, setRole] = useState<Role>(defaults.role);
	const [status, setStatus] = useState<Status>(defaults.status);

	function onReset() {
		setRole(defaults.role);
		setStatus(defaults.status);
	}

	function onChangeOpen(next: boolean) {
		setOpen(next);

		if (!next) {
			onReset();
		}
	}

	function onApply() {
		setSearchParams({
			role: role === 'all' ? null : role,
			status: status === 'all' ? null : status,
		});

		setOpen(false);
	}

	function onClear() {
		setSearchParams({ role: null, status: null });
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
					<SheetTitle>Filtrar Usuários</SheetTitle>
					<SheetDescription>Consulta avançada de registros</SheetDescription>
				</SheetHeader>
				<Separator />
				<div className='px-4 space-y-3 overflow-auto'>
					<Field>
						<FieldLabel>Perfil</FieldLabel>
						<div className='flex flex-wrap gap-1.5'>
							<FilterBadge
								active={role === 'all'}
								onClick={() => setRole('all')}
							>
								Todos
							</FilterBadge>
							{STAFF_ROLES.map((item) => (
								<FilterBadge
									key={item}
									active={role === item}
									onClick={() => setRole(item)}
								>
									{translateStaffRole(item)}
								</FilterBadge>
							))}
						</div>
					</Field>
					<Field>
						<FieldLabel>Status</FieldLabel>
						<div className='flex flex-wrap gap-1.5'>
							{STATUS_LABEL.map(([value, label]) => (
								<FilterBadge
									key={value}
									active={status === value}
									onClick={() => setStatus(value)}
								>
									{label}
								</FilterBadge>
							))}
						</div>
					</Field>
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

function UsersFiltersCount() {
	const [searchParams] = useUsersSearchParams();

	const count = [searchParams.role, searchParams.status].filter(Boolean).length;

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

export { UsersFilters, UsersFiltersCount };
