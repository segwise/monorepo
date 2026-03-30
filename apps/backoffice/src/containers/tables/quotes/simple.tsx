'use client';

import { maskPhone, maskPlate } from '@segwise/core/masks';
import {
	translateModality,
	translateQuoteStatus,
} from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import {
	CarIcon,
	EyeIcon,
	InfoIcon,
	PrinterIcon,
	Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';
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
import { placeholder } from '@/config/placeholder';
import { DialogQuoteDeleteById } from '@/containers/dialogs/quotes/delete';
import { useQuotesSimple } from '@/hooks/quotes/use-quotes';
import { useVehiclesManufacturers } from '@/libraries/hooks/vehicles/use-vehicles-manufacturers';
import { useSearchParams } from '@/libraries/search-params/quotes';

function TableQuotesSimple() {
	const [searchParams] = useSearchParams();

	const { data, isPending, isSuccess } = useQuotesSimple(searchParams);

	const { data: manufacturers } = useVehiclesManufacturers();

	const items = data?.data || [];
	const total = data?.total;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='text-left w-60'>Segurado</TableHead>
					<TableHead className='text-left flex-1'>Dados</TableHead>
					<TableHead className='text-center w-40'>Tipo</TableHead>
					<TableHead className='text-center w-40'>Status</TableHead>
					<TableHead className='text-center w-40'>Solicitado Em</TableHead>
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
										<Skeleton className='w-46 h-3.5 mb-1' />
										<Skeleton className='w-26 h-3' />
									</div>
								</div>
							</TableCell>
							<TableCell className='flex-1'>
								<div className='flex flex-row items-center justify-start gap-x-3'>
									<Skeleton className='size-8 rounded-full' />
									<div>
										<Skeleton className='w-26 h-3.5 mb-1' />
										<Skeleton className='w-18 h-3' />
									</div>
								</div>
							</TableCell>
							<TableCell className='w-40'>
								<Skeleton className='w-20 h-4 rounded-full mx-auto' />
							</TableCell>
							<TableCell className='w-40'>
								<Skeleton className='w-20 h-4 rounded-full mx-auto' />
							</TableCell>
							<TableCell className='w-40'>
								<Skeleton className='w-20 h-4 rounded-full mx-auto' />
							</TableCell>
							<TableCell className='justify-end flex flex-row gap-x-2'>
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
				{items.map(({ id, modality, insured, vehicle, status, requestAt }) => (
					<TableRow key={id}>
						<TableCell className='text-left w-60'>
							<div className='flex flex-row items-center justify-start gap-x-2'>
								<Avatar className='size-8 border bg-background'>
									<AvatarImage
										src={insured.image || placeholder.user}
										width={52}
										height={52}
										alt='Image do usuário'
										priority
									/>
									<AvatarFallback>
										{insured.name.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div>
									<span className='block text-sm font-medium truncate line-clamp-1'>
										{capitalizeFirstLetters(insured.name)}
									</span>
									<span className='block text-xs text-muted-foreground font-normal leading-none'>
										{maskPhone(insured.contact.phone)}
									</span>
								</div>
							</div>
						</TableCell>
						<TableCell className='text-left flex-1'>
							{!!vehicle && (
								<div className='flex flex-row items-center justify-start gap-x-3'>
									<Avatar className='size-8 rounded-none bg-background'>
										{!!manufacturers?.find(
											(props) => props.id === vehicle.manufacturer,
										)?.icon && (
											<AvatarImage
												src={
													manufacturers?.find(
														(props) => props.id === vehicle.manufacturer,
													)?.icon as string
												}
												width={52}
												height={52}
												alt='Marca do veículo'
												priority
											/>
										)}
										<AvatarFallback>
											{manufacturers
												?.find((props) => props.id === vehicle.manufacturer)
												?.name.slice(0, 2)
												.toUpperCase() || 'SP'}
										</AvatarFallback>
									</Avatar>
									<div>
										<span className='block text-sm font-medium truncate line-clamp-1 capitalize'>
											{vehicle.plate ? vehicle.model : 'Sem Placa'}
										</span>
										{vehicle.plate && (
											<span className='block text-xs text-muted-foreground font-normal leading-none uppercase'>
												{maskPlate(vehicle.plate)}
											</span>
										)}
										{!vehicle.plate && (
											<span className='block text-xs text-muted-foreground font-normal leading-none'>
												Verificar veículo
											</span>
										)}
									</div>
								</div>
							)}
						</TableCell>
						<TableCell className='text-center w-40'>
							<Badge className='dark:border-input'>
								{modality === 'car' && (
									<Fragment>
										<CarIcon className='size-4' /> {translateModality(modality)}
									</Fragment>
								)}
							</Badge>
						</TableCell>
						<TableCell className='text-center w-40'>
							<Badge
								className='w-25 truncate line-clamp-1 mx-auto dark:border dark:border-input'
								variant={
									status === 'confirmed'
										? 'success'
										: status === 'recused'
											? 'destructive'
											: status === 'waiting'
												? 'warning'
												: status === 'sent'
													? 'active'
													: 'default'
								}
							>
								{translateQuoteStatus(status)}
							</Badge>
						</TableCell>
						<TableCell className='text-center w-40'>
							<Badge className='w-20 truncate line-clamp-1 mx-auto dark:border dark:border-input'>
								{formatDistanceToNowStrict(requestAt)}
							</Badge>
						</TableCell>
						<TableCell className='justify-end flex flex-row gap-x-2'>
							<Button variant='outline' size='icon-sm' asChild>
								<Link href={`/quotes/${id}`}>
									<EyeIcon />
								</Link>
							</Button>
							<Button variant='outline' size='icon-sm' asChild>
								<Link
									target='_blank'
									href={`${process.env.NEXT_PUBLIC_API_URL}/quotes/${id}/print`}
								>
									<PrinterIcon />
								</Link>
							</Button>
							<DialogQuoteDeleteById id={id}>
								<Button variant='destructive' size='icon-sm'>
									<Trash2Icon />
								</Button>
							</DialogQuoteDeleteById>

							{/* <DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='outline'
										size='icon-sm'
										className='dark:bg-foreground/5 dark:border-input'
									>
										<MoreHorizontalIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem asChild>
										<Link
											target='_blank'
											href={`${process.env.NEXT_PUBLIC_API_URL}/quotes/${id}/print`}
										>
											<PrinterIcon /> Imprimir
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DialogQuoteDeleteById id={id}>
										<DropdownMenuItem variant='destructive'>
											<Trash2Icon /> Apagar
										</DropdownMenuItem>
									</DialogQuoteDeleteById>
								</DropdownMenuContent>
							</DropdownMenu> */}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export { TableQuotesSimple };
