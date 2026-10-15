'use client';

import { maskPhone } from '@segwise/core/masks';
import type { UserListItem } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import {
	BanIcon,
	CheckCircleIcon,
	FilterIcon,
	LockIcon,
	PencilIcon,
	PlusIcon,
	RefreshCwIcon,
	Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { DialogMarketingConfirm } from '@/containers/dialogs/marketing/confirm';
import { DialogUserEdit } from '@/containers/dialogs/users/edit';
import { DialogUserRegister } from '@/containers/dialogs/users/register';
import { MarketingSearch } from '@/containers/marketing/search';
import { UsersFilters, UsersFiltersCount } from '@/containers/users/filters';
import { UserRoleBadge } from '@/containers/users/role-badge';
import {
	useUsers,
	useUsersDelete,
	useUsersInvitationDelete,
	useUsersInvitationResend,
	useUsersStatus,
} from '@/libraries/hooks/users/use-users';
import { useUsersSearchParams } from '@/libraries/search-params/users';

type Confirm = {
	kind: 'suspend' | 'reactivate' | 'remove' | 'delete';
	user: UserListItem;
};

function RowActions({
	user,
	onEdit,
	onConfirm,
}: {
	user: UserListItem;
	onEdit: () => void;
	onConfirm: (confirm: Confirm) => void;
}) {
	const resend = useUsersInvitationResend(user.id);

	if (!user.canManage || user.status === 'deleted') {
		return <span className='text-xs text-muted-foreground'>—</span>;
	}

	if (user.origin === 'pending') {
		return (
			<>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size='icon-sm'
							variant='outline'
							isPending={resend.isPending}
							onClick={() =>
								resend.mutate(undefined, {
									onSuccess: () => toast.success('CONVITE REENVIADO!'),
									onError: (error) => toast.error(error.message),
								})
							}
						>
							<RefreshCwIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Reenviar convite</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size='icon-sm'
							variant='destructive'
							onClick={() => onConfirm({ kind: 'delete', user })}
						>
							<Trash2Icon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Excluir convite</TooltipContent>
				</Tooltip>
			</>
		);
	}

	const suspended = user.status === 'suspended';

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button size='icon-sm' variant='outline' onClick={onEdit}>
						<PencilIcon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Editar</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size='icon-sm'
						variant='outline'
						onClick={() =>
							onConfirm({ kind: suspended ? 'reactivate' : 'suspend', user })
						}
					>
						{suspended ? (
							<CheckCircleIcon />
						) : (
							<BanIcon className='text-destructive' />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{suspended ? 'Reativar acesso' : 'Suspender acesso'}
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size='icon-sm'
						variant='destructive'
						onClick={() => onConfirm({ kind: 'remove', user })}
					>
						<Trash2Icon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Excluir usuário</TooltipContent>
			</Tooltip>
		</>
	);
}

function ConfirmDialog({
	confirm,
	onClose,
}: {
	confirm: Confirm | null;
	onClose: () => void;
}) {
	// Hooks sempre montados com o id do alvo (ou vazio, nunca disparado).
	const id = confirm?.user.id ?? '';
	const status = useUsersStatus(id);
	const removeUser = useUsersDelete(id);
	const remove = useUsersInvitationDelete(id);

	if (!confirm) {
		return null;
	}

	const name = confirm.user.name
		? capitalizeFirstLetters(confirm.user.name)
		: confirm.user.email;

	const config = {
		suspend: {
			title: 'Suspender Acesso',
			description: `${name} perde o acesso ao sistema imediatamente. Os dados e o histórico são mantidos e o acesso pode ser reativado depois.`,
			pending: status.isPending,
			run: () => status.mutate('suspended', handlers('USUÁRIO SUSPENSO!')),
		},
		reactivate: {
			title: 'Reativar Acesso',
			description: `${name} volta a acessar o sistema com o mesmo perfil.`,
			pending: status.isPending,
			run: () => status.mutate('active', handlers('ACESSO REATIVADO!')),
		},
		remove: {
			title: 'Excluir Usuário',
			description: `${name} perde o acesso ao sistema. Nada é apagado: o cadastro e os dados ligados a ele ficam guardados e, se precisar, basta cadastrar o mesmo e-mail de novo para restaurar tudo.`,
			pending: removeUser.isPending,
			run: () => removeUser.mutate(undefined, handlers('USUÁRIO EXCLUÍDO!')),
		},
		delete: {
			title: 'Excluir Convite',
			description: `O convite enviado para ${confirm.user.email} deixa de valer e o link do e-mail não funciona mais.`,
			pending: remove.isPending,
			run: () => remove.mutate(undefined, handlers('CONVITE EXCLUÍDO!')),
		},
	}[confirm.kind];

	function handlers(message: string) {
		return {
			onSuccess() {
				toast.success(message);
				onClose();
			},
			onError(error: Error) {
				toast.error(error.message);
			},
		};
	}

	return (
		<DialogMarketingConfirm
			open
			onOpenChange={(open) => !open && onClose()}
			title={config.title}
			description={config.description}
			isPending={config.pending}
			onConfirm={config.run}
		/>
	);
}

function UsersPage() {
	const [searchParams, setSearchParams] = useUsersSearchParams();
	const { data, isPending, error } = useUsers(searchParams.search);

	const [editUser, setEditUser] = useState<UserListItem | null>(null);
	const [confirm, setConfirm] = useState<Confirm | null>(null);

	const forbidden =
		!!error &&
		(error as { response?: { status?: number } }).response?.status === 403;

	const items = (data?.items ?? []).filter(
		(user) =>
			(!searchParams.role || user.role === searchParams.role) &&
			(searchParams.status
				? user.status === searchParams.status
				: user.status !== 'deleted'),
	);

	if (forbidden) {
		return (
			<main className='mt-1'>
				<Empty className='bg-muted/30'>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<LockIcon />
						</EmptyMedia>
						<EmptyTitle>Sem permissão para ver usuários</EmptyTitle>
						<EmptyDescription>
							Apenas dono, administrador e gerente acessam esta área.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</main>
		);
	}

	return (
		<main className='grid grid-cols-1 gap-6 max-sm:gap-3 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div>
					<h1 className='text-lg font-semibold leading-none'>Usuários</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Equipe da corretora e os perfis de acesso de cada pessoa
					</p>
				</div>
				{!!data?.assignableRoles.length && (
					<DialogUserRegister assignableRoles={data.assignableRoles}>
						<Button>
							<PlusIcon /> Novo usuário
						</Button>
					</DialogUserRegister>
				)}
			</div>
			<div className='flex flex-row max-sm:flex-col max-sm:space-y-2 sm:items-center sm:justify-between'>
				<MarketingSearch
					className='max-sm:w-full'
					placeholder='Pesquisar nome ou e-mail...'
					value={searchParams.search || ''}
					onChange={(search) => setSearchParams({ search })}
				/>
				<UsersFilters>
					<Button variant='outline' className='dark:bg-primary max-sm:flex-1'>
						<FilterIcon /> Filtrar <UsersFiltersCount />
					</Button>
				</UsersFilters>
			</div>
			<Card className='p-0 overflow-hidden'>
				<CardContent className='p-0'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='text-left flex-1'>Usuário</TableHead>
								<TableHead className='text-left w-44 max-md:hidden'>
									Celular
								</TableHead>
								<TableHead className='text-center w-36'>Perfil</TableHead>
								<TableHead className='text-center w-40'>Status</TableHead>
								<TableHead className='text-right w-40'>Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isPending &&
								Array.from({ length: 5 }).map((_, index) => (
									<TableRow
										key={index.toString()}
										className='hover:bg-transparent'
									>
										<TableCell colSpan={100}>
											<Skeleton className='w-full h-8' />
										</TableCell>
									</TableRow>
								))}
							{!isPending && items.length === 0 && (
								<TableRow className='hover:bg-transparent'>
									<TableCell colSpan={100} className='text-center py-10'>
										<span className='text-sm text-muted-foreground'>
											{data?.items.length
												? 'Nenhum usuário encontrado com os filtros'
												: 'Nenhum usuário cadastrado'}
										</span>
									</TableCell>
								</TableRow>
							)}
							{items.map((user) => (
								<TableRow key={`${user.origin}-${user.id}`}>
									<TableCell className='text-left flex-1 min-w-0'>
										<span className='block text-sm font-medium truncate'>
											{user.name ? capitalizeFirstLetters(user.name) : '—'}
										</span>
										<span className='block text-xs text-muted-foreground font-normal leading-none truncate mt-0.5'>
											{user.email}
										</span>
									</TableCell>
									<TableCell className='text-left w-44 text-xs font-medium max-md:hidden'>
										{user.phone ? maskPhone(user.phone) : '—'}
									</TableCell>
									<TableCell className='w-36 text-center'>
										<UserRoleBadge role={user.role} />
									</TableCell>
									<TableCell className='w-40 text-center'>
										{user.status === 'pending' ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<Badge
														variant={
															user.expiresAt &&
															new Date(user.expiresAt) < new Date()
																? 'destructive'
																: 'warning'
														}
														className='px-2'
													>
														{user.expiresAt &&
														new Date(user.expiresAt) < new Date()
															? 'Convite expirado'
															: 'Convite pendente'}
													</Badge>
												</TooltipTrigger>
												<TooltipContent>
													{user.expiresAt
														? `Válido até ${format(new Date(user.expiresAt), 'dd/MM/yyyy')}`
														: ''}
												</TooltipContent>
											</Tooltip>
										) : (
											<Tooltip>
												<TooltipTrigger asChild>
													<Badge
														variant={
															user.status === 'deleted'
																? 'destructive'
																: user.status === 'suspended'
																	? 'warning'
																	: 'success'
														}
														className='px-2'
													>
														{user.status === 'deleted'
															? 'Excluído'
															: user.status === 'suspended'
																? 'Suspenso'
																: 'Ativo'}
													</Badge>
												</TooltipTrigger>
												<TooltipContent>
													{user.status === 'deleted'
														? 'Sem acesso. Para restaurar, cadastre o mesmo e-mail de novo'
														: user.status === 'suspended'
															? 'Sem acesso até ser reativado'
															: 'Com acesso ao sistema'}
												</TooltipContent>
											</Tooltip>
										)}
									</TableCell>
									<TableCell className='justify-end flex flex-row gap-x-2 w-40'>
										<RowActions
											user={user}
											onEdit={() => setEditUser(user)}
											onConfirm={setConfirm}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
			{editUser && data && (
				<DialogUserEdit
					key={editUser.id}
					user={editUser}
					assignableRoles={data.assignableRoles}
					open
					onOpenChange={(open) => !open && setEditUser(null)}
				/>
			)}
			<ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
		</main>
	);
}

export default UsersPage;
