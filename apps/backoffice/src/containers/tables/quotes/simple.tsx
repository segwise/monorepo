'use client';

import { maskPhone, maskPlate } from '@segwise/core/masks';
import { SchemaModality } from '@segwise/core/schemas';
import {
	translateModality,
	translateQuoteStatus,
} from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import {
	addHours,
	differenceInDays,
	format,
	formatDistanceToNow,
	formatDistanceToNowStrict,
	isAfter,
} from 'date-fns';
import {
	CarIcon,
	InfoIcon,
	PrinterCheckIcon,
	PrinterIcon,
	Trash2Icon,
} from 'lucide-react';
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
import { DialogQuoteDeleteById } from '@/containers/dialogs/quotes/delete';
import { useQuotesSimple } from '@/hooks/quotes/use-quotes';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';
import { useProducersSimpleFull } from '@/libraries/hooks/producers/use-producers';
import { useQuotesPrintById } from '@/libraries/hooks/quotes/use-quotes-print';
import { useVehiclesManufacturers } from '@/libraries/hooks/vehicles/use-vehicles-manufacturers';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { cn } from '@/libraries/utils';

const STORAGE_KEY = 'printed-quotes';

function getStoredQuotePrintedIds(): Set<string> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);

		return new Set(raw ? JSON.parse(raw) : []);
	} catch {
		return new Set();
	}
}

function TableQuotesSimple() {
	const [searchParams] = useSearchParams();

	const [printedIds, setPrintedIds] = useState<Set<string>>(
		getStoredQuotePrintedIds,
	);

	const { data, isPending, isSuccess } = useQuotesSimple({
		cursor: searchParams.cursor,
		insuranceCompanies: searchParams.insuranceCompanies,
		brokers: searchParams.brokers,
		limit: searchParams.limit,
		modality: searchParams.modality,
		producers: searchParams.producers,
		renewal: searchParams.renewal,
		requestedAt: searchParams.requestedAt,
		search: searchParams.search,
		status: searchParams.status,
	});

	const { data: producers } = useProducersSimpleFull();
	const { data: insuranceCompanies } = useInsuranceCompaniesSimple();

	const {
		mutate: mutateQuotePrint,
		isPending: isPendingQuotePrint,
		variables: variablesQuotePrint,
	} = useQuotesPrintById();

	const { data: manufacturers } = useVehiclesManufacturers();

	const items = data?.data || [];
	const total = data?.total;

	function markAsPrinted(id: string) {
		setPrintedIds((previous) => {
			const next = new Set(previous).add(id);

			if (previous.has(id)) {
				return previous;
			}

			localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));

			return next;
		});
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='text-left w-50'>Segurado</TableHead>
					<TableHead className='text-left flex-1'>Dados</TableHead>
					<TableHead className='text-left w-50' />
					<TableHead className='text-left w-30'>Produtor</TableHead>
					<TableHead className='text-center w-40'>Tipo</TableHead>
					<TableHead className='text-center w-40'>Status</TableHead>
					<TableHead className='text-center w-40 truncate'>
						Solicitado Em
					</TableHead>
					<TableHead className='text-right w-40'>Ações</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{isPending &&
					Array.from({ length: 10 }).map((_, index) => (
						<TableRow key={index.toString()} className='hover:bg-transparent'>
							<TableCell className='w-50'>
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
							<TableCell className='w-50' />
							<TableCell className='w-30'>
								<Skeleton className='size-8 rounded-full mx-auto' />
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
							<TableCell className='justify-end flex flex-row gap-x-2 w-40'>
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
					({
						id,
						modality,
						insured,
						vehicle,
						insuranceCompany,
						status,
						requestedAt,
						expiration,
						producer,
					}) => (
						<TableRow key={id}>
							<TableCell className='text-left w-50'>
								<div className='flex flex-row items-center justify-start gap-x-2'>
									<Avatar className='size-8 border bg-background'>
										<AvatarImage
											src={insured.image || placeholder.user}
											width={52}
											height={52}
											alt={capitalizeFirstLetters(insured.name)}
											priority
										/>
										<AvatarFallback>
											{insured.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<span className='block text-sm font-medium truncate line-clamp-1 max-w-40'>
											{capitalizeFirstLetters(insured.name)}
										</span>
										<span className='block text-xs text-muted-foreground font-normal leading-none'>
											{maskPhone(insured.contact.phone)}
										</span>
									</div>
								</div>
							</TableCell>
							<TableCell className='text-left flex-1'>
								<div className='flex flex-row items-center justify-start'>
									{!!vehicle && !!manufacturers?.length && (
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
													{
														manufacturers?.find(
															(props) => props.id === vehicle.manufacturer,
														)?.name as string
													}
												</TooltipContent>
											</Tooltip>
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
													<span className='block text-xs text-muted-foreground font-normal leading-none truncate'>
														Verificar veículo
													</span>
												)}
											</div>
										</div>
									)}
								</div>
							</TableCell>
							<TableCell className='text-left w-50'>
								{!!insuranceCompany && !!insuranceCompanies?.length && (
									<div className='flex flex-row items-center justify-start'>
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
																alt='Seguradora'
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
													<span className='text-xs text-muted-foreground font-normal leading-none truncate'>
														{format(
															addHours(
																expiration,
																new Date().getTimezoneOffset(),
															)
																.toString()
																.replace('Z', ''),
															'dd/MM/yyyy',
														)}{' '}
														{isAfter(expiration, new Date()) &&
															differenceInDays(expiration, new Date()) <= 7 &&
															`- ${formatDistanceToNow(expiration)
																.replace('cerca de ', '')
																.replace('mais de ', '')}`}
													</span>
												</div>
											)}
										</div>
									</div>
								)}
							</TableCell>
							<TableCell className='text-center w-30'>
								{!producers?.find((e) => e.id === producer) && '-------------'}
								{!!producers?.find((e) => e.id === producer) && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Avatar className='size-8 border bg-background mx-auto'>
												<AvatarImage
													src={
														producers?.find((e) => e.id === producer)?.avatar ||
														placeholder.user
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
										<TooltipContent>
											{capitalizeFirstLetters(
												producers?.find((e) => e.id === producer)
													?.name as string,
											)}
										</TooltipContent>
									</Tooltip>
								)}
							</TableCell>
							<TableCell className='text-center w-40'>
								<Badge className='dark:border-input truncate'>
									<CarIcon className='size-4' />{' '}
									{capitalizeFirstLetters(
										translateModality(modality)
											.toLowerCase()
											.replace('seguro', '')
											.replace('plano de', ''),
									).trim()}
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
									{formatDistanceToNowStrict(requestedAt)}
								</Badge>
							</TableCell>
							<TableCell className='justify-end flex flex-row gap-x-2 w-40'>
								{/* <Button variant='outline' size='icon-sm' asChild>
									<Link href={`/quotes/${id}`}>
										<EyeIcon />
									</Link>
								</Button> */}
								<Button
									disabled={modality !== SchemaModality.enum.vehicle}
									variant='outline'
									size='icon-sm'
									isPending={isPendingQuotePrint && variablesQuotePrint === id}
									onClick={() => {
										mutateQuotePrint(id);
										markAsPrinted(id);
									}}
									className={cn(
										'',
										isPendingQuotePrint && 'pointer-events-none',
									)}
								>
									{printedIds.has(id) ? <PrinterCheckIcon /> : <PrinterIcon />}
								</Button>
								<DialogQuoteDeleteById id={id}>
									<Button variant='destructive' size='icon-sm'>
										<Trash2Icon />
									</Button>
								</DialogQuoteDeleteById>
							</TableCell>
						</TableRow>
					),
				)}
			</TableBody>
		</Table>
	);
}

export { TableQuotesSimple };
