'use client';

import { maskPhone, maskPlate } from '@segwise/core/masks';
import { translateModality } from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import {
	differenceInDays,
	format,
	formatDistanceToNow,
	isAfter,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
	CarIcon,
	FileCogIcon,
	FileEditIcon,
	InfoIcon,
	MoreVerticalIcon,
	PaperclipIcon,
	ShieldPlusIcon,
	TagIcon,
	Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import { DialogSafeDeleteById } from '@/containers/dialogs/safes/delete';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';
import { useProducersSimpleFull } from '@/libraries/hooks/producers/use-producers';
import { useSafesSimple } from '@/libraries/hooks/safes/use-safes';
import { useVehiclesManufacturers } from '@/libraries/hooks/vehicles/use-vehicles-manufacturers';
import { useSearchParams } from '@/libraries/search-params/safes';
import { cn } from '@/libraries/utils';

function TableSafesSimple({ type }: { type: 'proposals' | 'policies' }) {
	const [searchParams] = useSearchParams();

	const { data, isPending, isSuccess } = useSafesSimple({
		effectived: type === 'policies',
		cursor: searchParams.cursor,
		insuranceCompanies: searchParams.insuranceCompanies,
		limit: searchParams.limit,
		modality: searchParams.modality,
		producers: searchParams.producers,
		renewal: searchParams.renewal,
		effectivedAt: searchParams.effectivedAt,
		search: searchParams.search,
		status: searchParams.status,
	});

	const { data: insuranceCompanies } = useInsuranceCompaniesSimple();
	const { data: producers } = useProducersSimpleFull();

	const { data: manufacturers } = useVehiclesManufacturers();

	const items = data?.data || [];
	const total = data?.total;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='text-left w-50'>Segurado</TableHead>
					<TableHead className='text-left w-50'>Dados</TableHead>
					<TableHead className='text-left w-50'>Seguradora</TableHead>
					<TableHead className='text-center w-30' />
					<TableHead className='text-center w-40'>Tipo</TableHead>
					<TableHead className='text-right flex-1'>Comissão</TableHead>
					<TableHead className='text-right w-30'>Ações</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{isPending &&
					Array.from({ length: 10 }).map((_, index) => (
						<TableRow key={index.toString()} className='hover:bg-transparent'>
							<TableCell className='w-50'>
								<div>
									<Skeleton className='w-42 h-3.5 mb-1' />
									<Skeleton className='w-26 h-3' />
								</div>
							</TableCell>
							<TableCell className='w-50'>
								<div className='flex flex-row items-center justify-start gap-x-3'>
									<Skeleton className='size-8 rounded-full' />
									<div>
										<Skeleton className='w-34 h-3.5 mb-1' />
										<Skeleton className='w-18 h-3' />
									</div>
								</div>
							</TableCell>
							<TableCell className='w-50'>
								<div className='flex flex-row items-center justify-start gap-x-3'>
									<Skeleton className='size-8 rounded-full' />
									<div>
										<Skeleton className='w-26 h-3.5 mb-1' />
										<Skeleton className='w-18 h-3' />
									</div>
								</div>
							</TableCell>
							<TableCell className='w-30' />
							<TableCell className='w-40'>
								<Skeleton className='w-24 h-4.5 rounded-full mx-auto' />
							</TableCell>
							<TableCell className='flex-1'>
								<div className='flex flex-row items-center justify-end gap-x-3'>
									<div>
										<Skeleton className='w-26 h-3.5 mb-1' />
										<Skeleton className='w-18 h-3 ml-auto' />
									</div>
									<div className='w-px h-8 bg-border' />
									<div>
										<Skeleton className='size-6' />
									</div>
								</div>
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
					({
						id,
						modality,
						insured,
						vehicle,
						renewal,
						insuranceCompany,
						producer,
						expiration,
						commission,
					}) => (
						<TableRow key={id}>
							<TableCell className='text-left w-50'>
								<div>
									<Tooltip>
										<TooltipTrigger asChild>
											<span className='block text-sm font-medium line-clamp-1!'>
												{capitalizeFirstLetters(insured.name)}
											</span>
										</TooltipTrigger>
										<TooltipContent align='start'>
											{capitalizeFirstLetters(insured.name)}
										</TooltipContent>
									</Tooltip>
									<span className='block text-xs text-muted-foreground font-normal leading-none'>
										{maskPhone(insured.contact.phone)}
									</span>
								</div>
							</TableCell>
							<TableCell className='text-left w-50'>
								<div className='flex flex-row items-center justify-start'>
									{!!vehicle && (
										<div className='flex flex-row items-center justify-start gap-x-3'>
											<Tooltip>
												<TooltipTrigger
													asChild
													className={cn(
														'',
														!vehicle.manufacturer && 'pointer-events-none',
													)}
												>
													<Avatar className='size-8 rounded-none bg-background'>
														{!!manufacturers?.find(
															(props) => props.id === vehicle.manufacturer,
														)?.icon && (
															<AvatarImage
																src={
																	manufacturers?.find(
																		(props) =>
																			props.id === vehicle.manufacturer,
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
																?.find(
																	(props) => props.id === vehicle.manufacturer,
																)
																?.name.slice(0, 2)
																.toUpperCase() || 'SP'}
														</AvatarFallback>
													</Avatar>
												</TooltipTrigger>
												<TooltipContent>
													{capitalizeFirstLetters(
														(manufacturers?.find(
															(props) => props.id === vehicle.manufacturer,
														)?.name as string) ?? '',
													)}
												</TooltipContent>
											</Tooltip>
											<div className='relative'>
												<Tooltip>
													<TooltipTrigger
														asChild
														className={cn(
															'',
															!vehicle.model && 'pointer-events-none',
														)}
													>
														<span className='block text-sm font-medium capitalize line-clamp-1!'>
															{vehicle.plate
																? capitalizeFirstLetters(
																		vehicle.model
																			.replace('/', ' / ')
																			.split('/')[1] ??
																			vehicle.model
																				.replace('/', ' / ')
																				.split('/')[0],
																	)
																: 'Sem Placa'}
														</span>
													</TooltipTrigger>
													<TooltipContent>
														{vehicle.plate
															? capitalizeFirstLetters(
																	vehicle.model
																		.replace('/', ' / ')
																		.split('/')[1] ??
																		vehicle.model
																			.replace('/', ' / ')
																			.split('/')[0],
																)
															: 'Sem Placa'}
													</TooltipContent>
												</Tooltip>
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
												<div className='absolute top-0 -right-1 translate-x-full flex flex-row items-center justify-start gap-x-1 scale-90'>
													<Tooltip>
														<TooltipTrigger>
															<TagIcon className='size-3 text-active' />
														</TooltipTrigger>
														<TooltipContent>Renovação</TooltipContent>
													</Tooltip>
												</div>
											</div>
										</div>
									)}
								</div>
							</TableCell>
							<TableCell className='text-left w-50'>
								<div className='flex flex-row items-center justify-start'>
									{!!insuranceCompany && (
										<div className='flex flex-row items-center justify-start gap-x-2'>
											<Tooltip>
												<TooltipTrigger asChild>
													<Avatar className='size-7 rounded-full bg-background'>
														{!!insuranceCompanies?.find(
															(props) => props.id === insuranceCompany,
														)?.icon && (
															<AvatarImage
																src={
																	insuranceCompanies?.find(
																		(props) => props.id === insuranceCompany,
																	)?.icon as string
																}
																width={52}
																height={52}
																alt='Marca do veículo'
																priority
															/>
														)}
														<AvatarFallback>
															{insuranceCompanies
																?.find((props) => props.id === insuranceCompany)
																?.name.slice(0, 2)
																.toUpperCase() || 'SS'}
														</AvatarFallback>
													</Avatar>
												</TooltipTrigger>
												<TooltipContent>
													{capitalizeFirstLetters(
														insuranceCompanies?.find(
															(props) => props.id === insuranceCompany,
														)?.name as string,
													)
														.replace('S/a', 'S/A')
														.replace('Bb ', 'BB ')
														.replace('Aig ', 'AIG ')}
												</TooltipContent>
											</Tooltip>
											{!!expiration && (
												<div className='flex flex-col items-start justify-start'>
													<span className='block text-xs font-medium truncate line-clamp-1'>
														Final da Vigência
													</span>
													<span className='text-xs text-muted-foreground font-normal leading-none flex flex-wrap'>
														{format(
															toZonedTime(expiration, 'UTC'),
															'dd/MM/yyyy',
														)}{' '}
														{isAfter(
															toZonedTime(expiration, 'UTC'),
															toZonedTime(new Date(), 'America/Sao_Paulo'),
														) &&
															differenceInDays(
																toZonedTime(expiration, 'UTC'),
																toZonedTime(new Date(), 'America/Sao_Paulo'),
															) <= 7 &&
															`- ${formatDistanceToNow(
																toZonedTime(expiration, 'UTC'),
															)
																.replace('cerca de ', '')
																.replace('mais de ', '')}`}
													</span>
												</div>
											)}
										</div>
									)}
								</div>
							</TableCell>
							<TableCell className='text-center w-30'>
								{!!producer && !!producers?.length && (
									<div className='flex flex-row items-center justify-center gap-x-2'>
										<Tooltip>
											<TooltipTrigger asChild>
												<Avatar className='size-8 border bg-background'>
													<AvatarImage
														src={
															producers?.find((e) => e.id === producer)
																?.avatar || placeholder.user
														}
														width={52}
														height={52}
														alt={capitalizeFirstLetters(
															producers?.find((e) => e.id === producer)
																?.name as string,
														)}
														priority
													/>
													<AvatarFallback>
														{producers
															?.find((e) => e.id === producer)
															?.name.slice(0, 2)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
											</TooltipTrigger>
											<TooltipContent align='center'>
												{capitalizeFirstLetters(
													producers?.find((e) => e.id === producer)
														?.name as string,
												)}
											</TooltipContent>
										</Tooltip>
									</div>
								)}
							</TableCell>
							<TableCell className='text-center w-40'>
								<Badge className='dark:border-input'>
									{modality === 'vehicle' && (
										<Fragment>
											<CarIcon className='size-4' />{' '}
											{capitalizeFirstLetters(
												translateModality(modality)
													.toLowerCase()
													.replace('seguro', '')
													.trim(),
											)}
										</Fragment>
									)}
								</Badge>
							</TableCell>
							<TableCell className='text-right flex-1'>
								{!!commission && (
									<div className='flex flex-row items-center justify-end'>
										<div className='flex flex-row items-center justify-start gap-x-2'>
											<div className='flex flex-col items-start justify-end'>
												<span className='ml-auto block text-xs font-medium truncate line-clamp-1 mb-0.5'>
													{new Intl.NumberFormat('pt-BR', {
														style: 'currency',
														currency: 'BRL',
													}).format(commission.award)}{' '}
													| {commission.percentage}%
												</span>
												<span className='ml-auto text-xs text-muted-foreground font-normal leading-none flex flex-wrap truncate line-clamp-1'>
													comissão:{' '}
													{new Intl.NumberFormat('pt-BR', {
														style: 'currency',
														currency: 'BRL',
													}).format(commission.commission)}
												</span>
											</div>
											<div className='w-px h-8 bg-border' />
											<div className='text-sm text-foreground font-medium'>
												{commission.installments}X
											</div>
										</div>
									</div>
								)}
							</TableCell>
							<TableCell className='flex flex-row justify-end gap-x-2 w-30'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant='outline' size='icon-sm'>
											<MoreVerticalIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent side='bottom' align='end'>
										<DropdownMenuItem asChild>
											<Link href={`/proposals/${id}?renewal=true`}>
												<ShieldPlusIcon className='size-4!' /> Renovar Seguro
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem>
											<PaperclipIcon className='size-4!' /> Apólice ( PDF )
										</DropdownMenuItem>
										<DropdownMenuItem>
											<FileEditIcon className='size-4!' /> Endosso
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link href={`/proposals/${id}`}>
												<FileCogIcon className='size-4!' /> Ajuste Geral
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DialogSafeDeleteById id={id}>
											<DropdownMenuItem variant='destructive'>
												<Trash2Icon className='size-4!' /> Excluir
											</DropdownMenuItem>
										</DialogSafeDeleteById>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					),
				)}
			</TableBody>
		</Table>
	);
}

export { TableSafesSimple };
