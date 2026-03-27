import {
	CarIcon,
	FilterIcon,
	HomeIcon,
	MoreHorizontalIcon,
	PlusIcon,
	PrinterIcon,
	SearchIcon,
	XCircleIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { CardHeaderHome } from '@/containers/cards/header-home';
import { TablePagination } from '@/containers/tables/pagination';
import { TableQuotesSimple } from '@/containers/tables/quotes/simple';

export const metadata: Metadata = {
	title: 'Cotações',
};

async function QuotesPage() {
	await connection();

	return (
		<main className='grid grid-cols-1 gap-6 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2'>
					<InputGroup className='w-60'>
						<InputGroupInput placeholder='Pesquisar...' />
						<InputGroupAddon align='inline-end'>
							<InputGroupButton
								variant='default'
								size='icon-sm'
								className='size-10 -mr-2 rounded-l-none text-white'
							>
								<SearchIcon />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
					<Separator orientation='vertical' className='h-7 mx-2' />
					<div className='flex flex-row items-center justify-start gap-x-4 divide-x divide-border/50 *:pr-4'>
						<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
							<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
								Produtor:{' '}
								<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
							</span>
							<span className='text-muted-foreground truncate'>
								Nome do produtor
							</span>
						</div>
						<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
							<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
								Seguradoras:
								<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
							</span>
							<div className='flex flex-row items-center justify-start -space-x-1.5'>
								{Array.from({ length: 4 }).map((_, index) => (
									<Avatar
										key={index.toString()}
										className='size-5 bg-muted not-dark:border not-dark:border-foreground/30 dark:bg-white'
									>
										<AvatarImage
											src='https://xcarcorretora.com.br/_next/image?url=https%3A%2F%2Feerbunnlzzosgfxsuskw.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Finsurers%2F79c00f92-05e3-4569-8ad8-f3f31b24fbe8%2Flogo&w=64&q=100'
											width={52}
											height={52}
											alt='Seguradora'
											priority
										/>
										<AvatarFallback>AA</AvatarFallback>
									</Avatar>
								))}
							</div>
						</div>
						<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
							<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
								Período:
								<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
							</span>
							<span className='text-muted-foreground truncate'>
								00/00/0000 - 00/00/0000
							</span>
						</div>
						<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
							<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
								Tipo:
								<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
							</span>
							<Badge className='font-medium'>
								<CarIcon className='size-4 stroke-[1.4]' />
								Veicular
							</Badge>
						</div>
						<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
							<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
								Stauts:
								<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
							</span>
							<Badge variant='default' className='font-medium'>
								Aguardando
							</Badge>
						</div>
						<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
							<Button
								variant='link'
								size='sm'
								className='text-xs [&_svg]:size-3 text-destructive'
							>
								<XCircleIcon />
								Limpar tudo
							</Button>
						</div>
					</div>
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<Button variant='outline' className='dark:bg-primary'>
						<FilterIcon /> Filtrar{' '}
						<Badge
							variant='active'
							className='size-4 text-[0.6rem] items-center justify-center pointer-events-none'
						>
							1
						</Badge>
					</Button>
					<ButtonGroup>
						<Button asChild variant='outline' className='dark:bg-primary'>
							<Link href='/quotes/register'>
								<PlusIcon /> Cadastrar
							</Link>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant='outline'
									size='icon'
									className='dark:bg-primary'
								>
									<MoreHorizontalIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem>
									<PrinterIcon /> Imprimir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
				</div>
			</div>
			<Separator />
			<div className='grid grid-cols-5 gap-x-3'>
				<CardHeaderHome
					icon={HomeIcon}
					title='Total Geral'
					value='0'
					percent={0}
				/>
				<CardHeaderHome
					icon={HomeIcon}
					title='Pendentes'
					value='0'
					percent={0}
				/>
				<CardHeaderHome
					icon={HomeIcon}
					title='Em Andamento'
					value='0'
					percent={0}
				/>
				<CardHeaderHome
					icon={HomeIcon}
					title='Recusados'
					value='0'
					percent={0}
				/>
				<CardHeaderHome
					icon={HomeIcon}
					title='Confirmados'
					value='0'
					percent={0}
				/>
			</div>
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<TableQuotesSimple />
					</CardContent>
				</Card>
				<TablePagination queryKey={['quotes', 'simple']} />
			</div>
		</main>
	);
}

export default QuotesPage;
