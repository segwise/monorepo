'use client';

import { maskPhone, maskPlate } from '@segwise/core/masks';
import {
	translateModality,
	translateQuoteStatus,
} from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { formatDistanceToNow } from 'date-fns';
import {
	CarIcon,
	EyeIcon,
	MoreHorizontalIcon,
	PrinterIcon,
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

function TableQuotesSimple() {
	const { data } = useQuotesSimple({
		simple: true,
	});

	const { data: manufacturers } = useVehiclesManufacturers();

	const items = data?.data || [];

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
										{manufacturers?.find(
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
												.toUpperCase()}
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
								{formatDistanceToNow(requestAt).trim()}
							</Badge>
						</TableCell>
						<TableCell className='justify-end flex flex-row gap-x-2'>
							<Button variant='outline' size='icon-sm' asChild>
								<Link href={`/quotes/${id}`}>
									<EyeIcon />
								</Link>
							</Button>
							<DropdownMenu>
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
									<DropdownMenuItem
										onClick={() => {
											throw new Error('Falha na geração do PDF');
										}}
									>
										<PrinterIcon /> Imprimir
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DialogQuoteDeleteById id={id}>
										<DropdownMenuItem variant='destructive'>
											<Trash2Icon /> Apagar
										</DropdownMenuItem>
									</DialogQuoteDeleteById>
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export { TableQuotesSimple };
