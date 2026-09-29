'use client';

import { translateProducerType } from '@segwise/core';
import { maskCNPJ, maskCPF, maskPhone } from '@segwise/core/masks';
import type { ProducerSimple } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import { EyeIcon, InfoIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';
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
import { DialogProducerPartnerEdit } from '@/containers/dialogs/producers/edit';
import { DialogProducerInternalEdit } from '@/containers/dialogs/producers/edit-internal';
import { useProducersSimple } from '@/libraries/hooks/producers/use-producers';
import { useSearchParams } from '@/libraries/search-params/producers';
import { cn } from '@/libraries/utils';
import { SheetProducerView } from './view-sheet';

function TableProducersSimple() {
	const [searchParams] = useSearchParams();

	const { data, isPending, isSuccess } = useProducersSimple({
		cursor: searchParams.cursor,
		search: searchParams.search,
		limit: searchParams.limit,
		kind: searchParams.kind,
	});

	const [viewItem, setViewItem] = useState<ProducerSimple | null>(null);
	const [editItem, setEditItem] = useState<ProducerSimple | null>(null);

	function openEdit(item: ProducerSimple) {
		setViewItem(null);
		setEditItem(item);
	}

	const items = data?.data || [];
	const total = data?.total;

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='text-left w-60'>Dados</TableHead>
						<TableHead className='text-left w-60'>Contatos</TableHead>
						<TableHead className='text-left flex-1' />
						<TableHead className='text-center w-40'>Tipo</TableHead>
						<TableHead className='text-center w-40'>Desde</TableHead>
						<TableHead className='text-center w-40'>Status</TableHead>
						<TableHead className='text-right w-30'>Ações</TableHead>
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
								<TableCell className='justify-end flex flex-row gap-x-2 w-30'>
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
											{!!total && <InfoIcon />}
											{!total && <InfoIcon />}
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
					{items.map((item) => {
						const {
							id,
							name,
							typeOfProduction,
							avatar,
							cpf,
							cnpj,
							contact,
							memberSince,
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
											<AvatarFallback>
												{name.slice(0, 2).toUpperCase()}
											</AvatarFallback>
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
								<TableCell className='text-left w-60'>
									<div className='flex flex-row items-center justify-start gap-x-2'>
										<div>
											{contact.phone && (
												<span className='block text-xs font-medium truncate line-clamp-1'>
													{maskPhone(contact.phone)}
												</span>
											)}
											<span
												className={cn(
													'block text-xs font-medium truncate line-clamp-1',
													contact.phone && 'text-muted-foreground',
												)}
											>
												{contact.email}
											</span>
										</div>
									</div>
								</TableCell>
								<TableCell className='flex-1' />
								<TableCell className='w-40 text-center'>
									<Tooltip>
										<TooltipTrigger asChild>
											<Badge className='line-clamp-1'>
												{!typeOfProduction
													? 'Produtor'
													: capitalizeFirstLetters(
															translateProducerType(typeOfProduction) ?? '',
														)}
											</Badge>
										</TooltipTrigger>
										<TooltipContent>
											{!typeOfProduction
												? 'Produtor'
												: capitalizeFirstLetters(
														translateProducerType(typeOfProduction) ?? '',
													)}
										</TooltipContent>
									</Tooltip>
								</TableCell>
								<TableCell className='w-40 text-center text-xs font-medium'>
									{format(new Date(memberSince), 'dd/MM/yyyy')}
								</TableCell>
								<TableCell className='w-40 text-center'>
									<Badge variant='success' className='px-2'>
										Ativo
									</Badge>
								</TableCell>
								<TableCell className='justify-end flex flex-row gap-x-2 w-30'>
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
								</TableCell>
							</TableRow>
						);
					})}
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
		</>
	);
}

export { TableProducersSimple };
