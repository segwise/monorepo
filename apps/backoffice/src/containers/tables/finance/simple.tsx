'use client';

import { maskCNPJ, maskPhone } from '@segwise/core/masks';
import {
	translatePaymentMethod,
	translatePaymentStatus,
	translatePaymentType,
} from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isCNPJ, isPhone } from '@segwise/core/valids';
import { format } from 'date-fns';
import {
	BanknoteIcon,
	CheckIcon,
	CreditCardIcon,
	EyeIcon,
	InfoIcon,
	LandmarkIcon,
	MoreHorizontalIcon,
	PrinterIcon,
	ReceiptIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from 'lucide-react';
import { PixIcon } from '@/assets/icons/pix';
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
import { usePaymentsCashFlowSimple } from '@/libraries/hooks/payments/use-payments';
import { useSearchParams } from '@/libraries/search-params/payments';

function TableFinancesSimple() {
	const [searchParams] = useSearchParams();

	const { data, isPending, isSuccess } = usePaymentsCashFlowSimple({
		cursor: searchParams.cursor,
		search: searchParams.search,
		payers: searchParams.payers,
		receivers: searchParams.receivers,
		limit: searchParams.limit,
		status: searchParams.status,
		expiration: searchParams.expiration,
		paidAt: searchParams.paidAt,
		type: searchParams.type,
		method: searchParams.method,
		amount: searchParams.amount,
	});

	const items = data?.data || [];
	const total = data?.total;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='text-left w-60'>Pagador</TableHead>
					<TableHead className='text-left w-60'>Recebedor</TableHead>
					<TableHead className='text-left w-60'>Descrição</TableHead>
					<TableHead className='text-left w-40 truncate'>
						Forma de Pagamentos
					</TableHead>
					<TableHead className='text-center w-30'>Valor</TableHead>
					<TableHead className='text-center w-40'>Vencimento</TableHead>
					<TableHead className='text-center w-40'>Status</TableHead>
					<TableHead className='text-center w-40'>Tipo</TableHead>
					<TableHead className='text-right w-40'>Ações</TableHead>
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
								<div className='flex flex-row items-center justify-start gap-x-2'>
									<Skeleton className='size-8 rounded-full' />
									<div>
										<Skeleton className='w-32 h-3.5 mb-1' />
										<Skeleton className='w-20 h-3' />
									</div>
								</div>
							</TableCell>
							<TableCell className='w-60'>
								<Skeleton className='w-40 h-4 rounded-full' />
							</TableCell>
							<TableCell className='w-40'>
								<Skeleton className='w-30 h-4 rounded-full mx-auto' />
							</TableCell>
							<TableCell className='w-30'>
								<Skeleton className='w-20 h-4 rounded-full mx-auto' />
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
						payer,
						receiver,
						description,
						method,
						amount,
						amountPaid,
						paidAt,
						expiration,
						status,
						type,
					}) => (
						<TableRow key={id}>
							<TableCell className='text-left w-60'>
								<div className='flex flex-row items-center justify-start gap-x-2'>
									<Avatar className='size-8 border bg-background'>
										<AvatarImage
											src={payer.image || placeholder.user}
											width={52}
											height={52}
											alt='Nome do Pagador'
										/>
										<AvatarFallback>
											{payer.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<span className='block text-sm font-medium truncate line-clamp-1 max-w-40'>
											{capitalizeFirstLetters(payer.name)}
										</span>
										{payer.additional && (
											<span className='block text-xs text-muted-foreground font-normal leading-none truncate'>
												{isCNPJ(payer.additional)
													? maskCNPJ(payer.additional)
													: isPhone(payer.additional)
														? maskPhone(payer.additional)
														: payer.additional}
											</span>
										)}
									</div>
								</div>
							</TableCell>
							<TableCell className='text-left w-60'>
								<div className='flex flex-row items-center justify-start gap-x-2'>
									<Avatar className='size-8 border bg-background'>
										<AvatarImage
											src={receiver.image || placeholder.user}
											width={52}
											height={52}
											alt='Nome do Pagador'
										/>
										<AvatarFallback>
											{receiver.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<span className='block text-sm font-medium truncate line-clamp-1 max-w-40'>
											{capitalizeFirstLetters(receiver.name)}
										</span>
										{receiver.additional && (
											<span className='block text-xs text-muted-foreground font-normal leading-none truncate'>
												{isCNPJ(receiver.additional)
													? maskCNPJ(receiver.additional)
													: isPhone(receiver.additional)
														? maskPhone(receiver.additional)
														: receiver.additional}
											</span>
										)}
									</div>
								</div>
							</TableCell>
							<TableCell className='text-left w-60'>
								{description ? (
									<div className='flex flex-row items-center justify-start gap-x-2'>
										<Tooltip>
											<TooltipTrigger>
												<span className='block text-xs text-muted-foreground font-normal leading-none truncate max-w-40'>
													{description}
												</span>
											</TooltipTrigger>
											<TooltipContent align='center' className='max-w-60'>
												{description}
											</TooltipContent>
										</Tooltip>
									</div>
								) : (
									'-------------------------'
								)}
							</TableCell>
							<TableCell className='text-center w-40'>
								<Badge className='dark:border-input px-2'>
									{method === 'pix' && <PixIcon className='size-3!' />}
									{method === 'credit_card' && (
										<CreditCardIcon className='size-3!' />
									)}
									{method === 'billet' && <ReceiptIcon className='size-3!' />}
									{method === 'species' && <BanknoteIcon className='size-3!' />}
									{method === 'transfer' && (
										<LandmarkIcon className='size-3!' />
									)}{' '}
									{translatePaymentMethod(method)}
								</Badge>
							</TableCell>
							<TableCell className='text-center w-30'>
								<span className='block text-xs font-medium truncate line-clamp-1 max-w-40'>
									{new Intl.NumberFormat('pt-BR', {
										style: 'currency',
										currency: 'BRL',
									}).format(amount)}
								</span>
								{status === 'paid' && amountPaid && (
									<span className='block text-xs font-medium text-green-600 truncate line-clamp-1 max-w-40'>
										Pago:{' '}
										{new Intl.NumberFormat('pt-BR', {
											style: 'currency',
											currency: 'BRL',
										}).format(amountPaid)}
									</span>
								)}
							</TableCell>
							<TableCell className='text-center w-30'>
								<span className='block text-xs font-medium truncate line-clamp-1 max-w-40'>
									{format(expiration, 'dd/MM/yyyy')}
								</span>
								{status === 'paid' && paidAt && (
									<span className='block text-xs font-medium text-green-600 truncate line-clamp-1 max-w-40'>
										Pago: {format(paidAt, 'dd/MM/yyyy')}
									</span>
								)}
							</TableCell>
							<TableCell className='text-center w-40'>
								<Badge
									className='dark:border-input px-2'
									variant={
										status === 'paid'
											? 'success'
											: status === 'canceled' || status === 'expired'
												? 'destructive'
												: 'default'
									}
								>
									{status === 'paid' && <CheckIcon className='size-4' />}{' '}
									{translatePaymentStatus(status)}
								</Badge>
							</TableCell>
							<TableCell className='text-center w-40'>
								<Badge
									className='dark:border-input px-2'
									variant={type === 'revenue' ? 'success' : 'destructive'}
								>
									{type === 'revenue' && <TrendingUpIcon className='size-4' />}
									{type === 'expense' && (
										<TrendingDownIcon className='size-4' />
									)}{' '}
									{translatePaymentType(type)}
								</Badge>
							</TableCell>
							<TableCell className='justify-end flex flex-row gap-x-2 w-40'>
								<Button size='icon-sm' variant='outline'>
									<EyeIcon />
								</Button>
								<Button size='icon-sm' variant='outline'>
									<PrinterIcon />
								</Button>
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

export { TableFinancesSimple };
