'use client';

import { translateProducerType } from '@segwise/core';
import { maskPhone } from '@segwise/core/masks';
import type { ProducerPendingKind, ProducerType } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import { InfoIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
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
import { DialogProducerPendingDelete } from '@/containers/dialogs/producers/pending-delete';
import { useProducersPending } from '@/libraries/hooks/producers/use-producers-pending';
import { cn } from '@/libraries/utils';

function TableProducersPending({
	kind,
}: {
	kind: ProducerPendingKind | 'all';
}) {
	const { data, isPending, isSuccess } = useProducersPending(kind);

	const [deleteId, setDeleteId] = useState<string | null>(null);

	const items = data || [];

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='text-left w-60'>Dados</TableHead>
						<TableHead className='text-left w-60'>Contatos</TableHead>
						<TableHead className='text-left flex-1' />
						<TableHead className='text-center w-40'>Tipo</TableHead>
						<TableHead className='text-center w-40'>Convidado em</TableHead>
						<TableHead className='text-center w-40'>Expira em</TableHead>
						<TableHead className='text-right w-30'>Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isPending &&
						Array.from({ length: 5 }).map((_, index) => (
							<TableRow key={index.toString()} className='hover:bg-transparent'>
								<TableCell className='w-60'>
									<Skeleton className='w-32 h-3.5 mb-1' />
									<Skeleton className='w-20 h-3' />
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
									<Skeleton className='w-20 h-4 mx-auto' />
								</TableCell>
								<TableCell className='justify-end flex flex-row gap-x-2 w-30'>
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
										<EmptyTitle>Nenhum convite pendente!</EmptyTitle>
										<EmptyDescription className='max-w-xs text-pretty leading-snug'>
											Não há cadastros aguardando confirmação no momento
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</TableCell>
						</TableRow>
					)}
					{items.map(
						({
							id,
							kind: itemKind,
							name,
							email,
							phone,
							typeOfProduction,
							invitedAt,
							expiresAt,
						}) => (
							<TableRow key={id}>
								<TableCell className='text-left w-60'>
									<span className='block text-sm font-medium truncate line-clamp-1 max-w-40'>
										{name ? capitalizeFirstLetters(name) : '—'}
									</span>
								</TableCell>
								<TableCell className='text-left w-60'>
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
								</TableCell>
								<TableCell className='flex-1' />
								<TableCell className='w-40 text-center'>
									<Badge variant='warning' className='line-clamp-1'>
										{itemKind === 'partner'
											? typeOfProduction
												? capitalizeFirstLetters(
														translateProducerType(
															typeOfProduction as ProducerType,
														) ?? '',
													)
												: 'Parceiro'
											: 'Produtor'}
									</Badge>
								</TableCell>
								<TableCell className='w-40 text-center text-xs font-medium'>
									{format(new Date(invitedAt), 'dd/MM/yyyy')}
								</TableCell>
								<TableCell className='w-40 text-center text-xs font-medium'>
									{format(new Date(expiresAt), 'dd/MM/yyyy')}
								</TableCell>
								<TableCell className='justify-end flex flex-row gap-x-2 w-30'>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button size='icon-sm' variant='outline'>
												<MoreHorizontalIcon />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end'>
											<DropdownMenuItem
												variant='destructive'
												onClick={() => setDeleteId(id)}
											>
												<Trash2Icon className='size-4!' /> Excluir Convite
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						),
					)}
				</TableBody>
			</Table>
			{deleteId && (
				<DialogProducerPendingDelete
					id={deleteId}
					open={!!deleteId}
					onOpenChange={(next) => !next && setDeleteId(null)}
				/>
			)}
		</>
	);
}

export { TableProducersPending };
