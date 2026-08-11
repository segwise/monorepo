'use client';

import { translateProducerType } from '@segwise/core';
import { maskCNPJ, maskCPF, maskPhone } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { EyeIcon, InfoIcon, MoreHorizontalIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { DialogProducerRegister } from '@/containers/dialogs/producers/register';
import { useProducersSimple } from '@/libraries/hooks/producers/use-producers';
import { useSearchParams } from '@/libraries/search-params/producers';
import { cn } from '@/libraries/utils';

function TableProducersSimple() {
	const [searchParams] = useSearchParams();

	const { data, isPending, isSuccess } = useProducersSimple({
		cursor: searchParams.cursor,
		search: searchParams.search,
		limit: searchParams.limit,
	});

	const items = data?.data || [];
	const total = data?.total;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='text-left w-60'>Dados</TableHead>
					<TableHead className='text-left w-60'>Contatos</TableHead>
					<TableHead className='text-left flex-1' />
					<TableHead className='text-center w-40'>Tipo</TableHead>
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
								<Skeleton className='w-20 h-4 rounded-full mx-auto' />
							</TableCell>
							<TableCell className='justify-end flex flex-row gap-x-2 w-30'>
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
				{items.map(
					({ id, name, typeOfProduction, avatar, cpf, cnpj, contact }) => (
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
							<TableCell className='w-40 text-center'>
								<Badge variant='success' className='px-2'>
									Ativo
								</Badge>
							</TableCell>
							<TableCell className='justify-end flex flex-row gap-x-2 w-30'>
								<DialogProducerRegister id={id}>
									<Button size='icon-sm' variant='outline'>
										<EyeIcon />
									</Button>
								</DialogProducerRegister>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size='icon-sm' variant='outline'>
											<MoreHorizontalIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' />
								</DropdownMenu>
							</TableCell>
						</TableRow>
					),
				)}
			</TableBody>
		</Table>
	);
}

export { TableProducersSimple };
