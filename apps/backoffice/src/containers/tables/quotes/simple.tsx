'use client';

import { maskPhone, maskPlate } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { formatDistanceToNow } from 'date-fns';
import {
	CarIcon,
	HomeIcon,
	MoreHorizontalIcon,
	Trash2Icon,
} from 'lucide-react';
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
import { useQuotesSimple } from '@/hooks/quotes/use-quotes';

function TableQuotesSimple() {
	const { data } = useQuotesSimple({
		simple: true,
	});

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
					<TableHead className='text-right w-20'>Ações</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{items.map(({ id, type, insured, vehicle, status, requestAt }) => (
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
										<AvatarImage
											src={`https://xcarcorretora.com.br/_next/image?url=https%3A%2F%2Fapiplacas.com.br%2Flogos%2FlogosMarcas%2F${vehicle.manufacturer.toLowerCase().replaceAll(' ', '-')}.png&w=64&q=100`}
											width={52}
											height={52}
											alt='Marca do veículo'
											priority
										/>
										<AvatarFallback>
											{insured.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<span className='block text-sm font-medium truncate line-clamp-1 capitalize'>
											{vehicle.model}
										</span>
										{vehicle.plate && (
											<span className='block text-xs text-muted-foreground font-normal leading-none uppercase'>
												{maskPlate(vehicle.plate)}
											</span>
										)}
									</div>
								</div>
							)}
						</TableCell>
						<TableCell className='text-center w-40'>
							<Badge className='dark:border-input'>
								{type === 'car' && (
									<Fragment>
										<CarIcon className='size-4' /> Veicular
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
								{status === 'waiting' && 'Aguardando'}
								{status === 'quoting' && 'Cotando'}
								{status === 'quoted' && 'Cotado'}
								{status === 'sent' && 'Enviado'}
								{status === 'recused' && 'Recusado'}
								{status === 'confirmed' && 'Aceito'}
							</Badge>
						</TableCell>
						<TableCell className='text-center w-40'>
							<Badge className='w-20 truncate line-clamp-1 mx-auto dark:border dark:border-input'>
								{formatDistanceToNow(requestAt).trim()}
							</Badge>
						</TableCell>
						<TableCell className='text-right w-20'>
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
									<DropdownMenuItem>
										<HomeIcon /> Nome da ação
									</DropdownMenuItem>
									<DropdownMenuItem>
										<HomeIcon /> Nome da ação
									</DropdownMenuItem>
									<DropdownMenuItem>
										<HomeIcon /> Nome da ação
									</DropdownMenuItem>
									<DropdownMenuItem>
										<HomeIcon /> Nome da ação
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem variant='destructive'>
										<Trash2Icon /> Apagar
									</DropdownMenuItem>
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
