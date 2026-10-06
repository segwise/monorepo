'use client';

import { translateProducerType } from '@segwise/core';
import { maskCNPJ, maskCPF, maskPhone } from '@segwise/core/masks';
import type {
	ProducerListItem,
	ProducerSimple,
	ProducerType,
} from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import {
	EyeIcon,
	InfoIcon,
	PencilIcon,
	RefreshCwIcon,
	Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { placeholder } from '@/config/placeholder';
import { DialogProducerDelete } from '@/containers/dialogs/producers/delete';
import { DialogProducerPartnerEdit } from '@/containers/dialogs/producers/edit';
import { DialogProducerInternalEdit } from '@/containers/dialogs/producers/edit-internal';
import { DialogProducerPendingDelete } from '@/containers/dialogs/producers/pending-delete';
import { useProducersSimple } from '@/libraries/hooks/producers/use-producers';
import { useProducersPendingRenewById } from '@/libraries/hooks/producers/use-producers-pending-renew';
import { useSearchParams } from '@/libraries/search-params/producers';
import { cn } from '@/libraries/utils';
import { SheetProducerView } from './view-sheet';

type Pending = Extract<ProducerListItem, { origin: 'pending' }>;
type Active = Extract<ProducerListItem, { origin: 'active' }>;

function typeLabel(
	kind: 'partner' | 'producer',
	typeOfProduction?: string | null,
) {
	if (kind === 'producer' || !typeOfProduction) {
		return kind === 'producer' ? 'Produtor' : 'Parceiro';
	}

	return capitalizeFirstLetters(
		translateProducerType(typeOfProduction as ProducerType) ?? '',
	);
}

function ButtonPendingRenew({ id }: { id: string }) {
	const { mutate, isPending } = useProducersPendingRenewById(id);

	function onClick() {
		mutate(undefined, {
			onSuccess() {
				toast.success('CONVITE RENOVADO COM SUCESSO!');
			},
			onError(error) {
				toast.error(error.message || 'Falha ao renovar convite');
			},
		});
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size='icon-sm'
					variant='outline'
					isPending={isPending}
					onClick={onClick}
				>
					<RefreshCwIcon />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Renovar Convite</TooltipContent>
		</Tooltip>
	);
}

function ContactCell({
	phone,
	email,
}: {
	phone?: string | null;
	email: string;
}) {
	return (
		<TableCell className='text-left w-60'>
			<div>
				{phone && (
					<span className='block text-xs font-medium truncate line-clamp-1'>
						{maskPhone(phone)}
					</span>
				)}
				<span
					className={cn(
						'block text-xs font-medium truncate line-clamp-1',
						phone && 'text-muted-foreground',
					)}
				>
					{email}
				</span>
			</div>
		</TableCell>
	);
}

function TypeCell({ label }: { label: string }) {
	return (
		<TableCell className='w-40 text-center'>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge className='line-clamp-1'>{label}</Badge>
				</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
		</TableCell>
	);
}

function TableProducersSimple() {
	const [searchParams] = useSearchParams();

	const { data, isPending, isSuccess } = useProducersSimple({
		cursor: searchParams.cursor,
		search: searchParams.search,
		limit: searchParams.limit,
		kind: searchParams.kind,
		status: searchParams.status,
		from: searchParams.from,
		to: searchParams.to,
	});

	const [viewItem, setViewItem] = useState<ProducerSimple | null>(null);
	const [editItem, setEditItem] = useState<ProducerSimple | null>(null);
	const [deleteItem, setDeleteItem] = useState<ProducerSimple | null>(null);
	const [deleteInvitationId, setDeleteInvitationId] = useState<string | null>(
		null,
	);

	function openEdit(item: ProducerSimple) {
		setViewItem(null);
		setEditItem(item);
	}

	const items = data?.data || [];
	const total = data?.total;

	function renderActive(item: Active) {
		const {
			id,
			name,
			typeOfProduction,
			avatar,
			cpf,
			cnpj,
			contact,
			memberSince,
			status,
		} = item;

		return (
			<TableRow key={id}>
				<TableCell className='text-left w-60'>
					<div className='flex flex-row items-center justify-start gap-x-2'>
						<Avatar className='size-8 border bg-background'>
							<AvatarImage
								src={avatar || placeholder.user}
								width={52}
								height={52}
								alt='Nome do Pagador'
							/>
							<AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div>
							<span className='block text-sm font-medium truncate line-clamp-1 max-w-40'>
								{capitalizeFirstLetters(name)}
							</span>
							{(cpf || cnpj) && (
								<span className='block text-xs text-muted-foreground font-normal leading-none truncate'>
									{cnpj && maskCNPJ(cnpj)}
									{cpf && maskCPF(cpf)}
								</span>
							)}
						</div>
					</div>
				</TableCell>
				<ContactCell phone={contact.phone} email={contact.email} />
				<TableCell className='flex-1' />
				<TypeCell
					label={typeLabel(
						typeOfProduction ? 'partner' : 'producer',
						typeOfProduction,
					)}
				/>
				<TableCell className='w-40 text-center text-xs font-medium'>
					{format(new Date(memberSince), 'dd/MM/yyyy')}
				</TableCell>
				<TableCell className='w-40 text-center'>
					<Badge
						variant={status === 'suspended' ? 'warning' : 'success'}
						className='px-2'
					>
						{status === 'suspended' ? 'Suspenso' : 'Ativo'}
					</Badge>
				</TableCell>
				<TableCell className='justify-end flex flex-row gap-x-2'>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size='icon-sm'
								variant='outline'
								onClick={() => setViewItem(item)}
							>
								<EyeIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Visualizar</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size='icon-sm'
								variant='outline'
								onClick={() => openEdit(item)}
							>
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
								onClick={() => setDeleteItem(item)}
							>
								<Trash2Icon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Excluir</TooltipContent>
					</Tooltip>
				</TableCell>
			</TableRow>
		);
	}

	function renderPending(item: Pending) {
		const {
			id,
			kind,
			name,
			email,
			phone,
			typeOfProduction,
			invitedAt,
			expiresAt,
		} = item;

		const isExpired = new Date(expiresAt) < new Date();
		const label = name || email;

		return (
			<TableRow key={id}>
				<TableCell className='text-left w-60'>
					<div className='flex flex-row items-center justify-start gap-x-2'>
						<Avatar className='size-8 border bg-background'>
							<AvatarImage
								src={placeholder.user}
								width={52}
								height={52}
								alt='Convidado'
							/>
							<AvatarFallback>{label.slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div>
							<span className='block text-sm font-medium truncate line-clamp-1 max-w-40'>
								{name ? capitalizeFirstLetters(name) : '—'}
							</span>
							<span className='block text-xs text-muted-foreground font-normal leading-none truncate'>
								Aguardando cadastro
							</span>
						</div>
					</div>
				</TableCell>
				<ContactCell phone={phone} email={email} />
				<TableCell className='flex-1' />
				<TypeCell label={typeLabel(kind, typeOfProduction)} />
				<TableCell className='w-40 text-center text-xs font-medium'>
					{format(new Date(invitedAt), 'dd/MM/yyyy')}
				</TableCell>
				<TableCell className='w-40 text-center'>
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								variant={isExpired ? 'destructive' : 'warning'}
								className='px-2'
							>
								{isExpired ? 'Expirado' : 'Pendente'}
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							Convite {isExpired ? 'expirou' : 'expira'} em{' '}
							{format(new Date(expiresAt), 'dd/MM/yyyy')}
						</TooltipContent>
					</Tooltip>
				</TableCell>
				<TableCell className='justify-end flex flex-row gap-x-2'>
					{isExpired && <ButtonPendingRenew id={id} />}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size='icon-sm'
								variant='destructive'
								onClick={() => setDeleteInvitationId(id)}
							>
								<Trash2Icon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Excluir Convite</TooltipContent>
					</Tooltip>
				</TableCell>
			</TableRow>
		);
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='text-left w-60'>Dados</TableHead>
						<TableHead className='text-left w-60'>Contatos</TableHead>
						<TableHead className='text-left flex-1' />
						<TableHead className='text-center w-40'>Tipo</TableHead>
						<TableHead className='text-center w-40'>Desde / Convite</TableHead>
						<TableHead className='text-center w-40'>Status</TableHead>
						<TableHead className='text-right'>Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isPending &&
						Array.from({ length: 10 }).map((_, index) => (
							<TableRow key={index.toString()} className='hover:bg-transparent'>
								<TableCell className='w-60'>
									<div className='flex flex-row items-center justify-start gap-x-2'>
										<Skeleton className='size-8 rounded-full' />
										<div>
											<Skeleton className='w-32 h-3.5 mb-1' />
											<Skeleton className='w-20 h-3' />
										</div>
									</div>
								</TableCell>
								<TableCell className='w-60'>
									<Skeleton className='w-32 h-3.5 mb-1' />
									<Skeleton className='w-20 h-3' />
								</TableCell>
								<TableCell className='flex-1' />
								<TableCell className='w-40'>
									<Skeleton className='w-20 h-4 rounded-full mx-auto' />
								</TableCell>
								<TableCell className='w-40'>
									<Skeleton className='w-20 h-4 mx-auto' />
								</TableCell>
								<TableCell className='w-40'>
									<Skeleton className='w-20 h-4 rounded-full mx-auto' />
								</TableCell>
								<TableCell className='justify-end flex flex-row gap-x-2'>
									<Skeleton className='size-9 rounded-sm' />
									<Skeleton className='size-9 rounded-sm' />
									<Skeleton className='size-9 rounded-sm' />
								</TableCell>
							</TableRow>
						))}
					{isSuccess && items.length === 0 && (
						<TableRow className='hover:bg-transparent'>
							<TableCell colSpan={100}>
								<Empty className='h-full bg-muted/30'>
									<EmptyHeader>
										<EmptyMedia variant='icon'>
											<InfoIcon />
										</EmptyMedia>
										<EmptyTitle>
											{!!total && 'Nenhum Registro Encontrado!'}
											{!total && 'Não Há Registro no Banco de Dados!'}
										</EmptyTitle>
										<EmptyDescription className='max-w-xs text-pretty leading-snug'>
											{!!total &&
												'O resultado da consulta não obteve informações'}
											{!total &&
												'Nenhum registro armazenado no banco de dados até o momento'}
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</TableCell>
						</TableRow>
					)}
					{items.map((item) =>
						item.origin === 'pending'
							? renderPending(item)
							: renderActive(item),
					)}
				</TableBody>
			</Table>
			<SheetProducerView
				producer={viewItem}
				open={!!viewItem}
				onOpenChange={(next) => !next && setViewItem(null)}
				onEdit={() => viewItem && openEdit(viewItem)}
			/>
			{!!editItem &&
				(editItem.typeOfProduction ? (
					<DialogProducerPartnerEdit
						producer={editItem}
						open
						onOpenChange={(next) => !next && setEditItem(null)}
					/>
				) : (
					<DialogProducerInternalEdit
						producer={editItem}
						open
						onOpenChange={(next) => !next && setEditItem(null)}
					/>
				))}
			{!!deleteItem && (
				<DialogProducerDelete
					id={deleteItem.id}
					kind={deleteItem.typeOfProduction ? 'partner' : 'producer'}
					open
					onOpenChange={(next) => !next && setDeleteItem(null)}
				/>
			)}
			{deleteInvitationId && (
				<DialogProducerPendingDelete
					id={deleteInvitationId}
					open
					onOpenChange={(next) => !next && setDeleteInvitationId(null)}
				/>
			)}
		</>
	);
}

export { TableProducersSimple };
