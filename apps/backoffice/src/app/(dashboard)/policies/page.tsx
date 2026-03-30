import { fakerPT_BR as faker } from '@faker-js/faker';
import { translateModality } from '@segwise/core/translate';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
	AwardIcon,
	CarIcon,
	FilterIcon,
	HomeIcon,
	MoreHorizontalIcon,
	PlusIcon,
	PrinterIcon,
	SearchIcon,
	Trash2Icon,
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { CardHeaderHome } from '@/containers/cards/header-home';

const data = Array.from({ length: 10 }).map(() => ({
	id: faker.string.uuid(),
	modality: faker.helpers.arrayElement(['car']),
	renewal: faker.datatype.boolean(),
	insured: {
		image: faker.image.avatar(),
		name: faker.person.fullName(),
		phone: faker.phone.number({ style: 'human' }),
	},
	vehicle: {
		manufacturer: `${faker.vehicle.manufacturer()}`,
		model: `${faker.vehicle.model()}`,
		plate: faker.vehicle.vrm(),
	},
	validaty: faker.date.future().toISOString(),
	payments: {
		installments: faker.number.int({ min: 1, max: 12 }),
		commission: faker.number.int({ min: 100, max: 500 }),
		percent: faker.number.int({ min: 10, max: 25 }),
		award: faker.number.int({ min: 1000, max: 3000 }),
	},
}));

export const metadata: Metadata = {
	title: 'Apólices',
};

async function PoliciesPage() {
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
							<Badge className='font-normal'>
								<CarIcon className='size-4 stroke-[1.4]' />
								Veicular
							</Badge>
						</div>
						<div className='text-xs flex flex-col items-start justify-start gap-x-1'>
							<span className='font-medium mr-1 flex flex-row items-center justify-between w-full mb-1'>
								Stauts:
								<XCircleIcon className='size-3 ml-1 -mt-1.5 cursor-pointer text-destructive' />
							</span>
							<Badge variant='default' className='font-normal'>
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
							<Link href='/policies/register'>
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
									<PlusIcon /> Seguro congênere
								</DropdownMenuItem>
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
					isPending={false}
					icon={HomeIcon}
					title='Seguros'
					value='0'
					percent={0}
					before='0'
					type='year'
					setType={() => {}}
				/>
				<CardHeaderHome
					isPending={false}
					icon={HomeIcon}
					title='Prêmio Líquido'
					value='0'
					percent={0}
					before='0'
					type='year'
					setType={() => {}}
				/>
				<CardHeaderHome
					isPending={false}
					icon={HomeIcon}
					title='Média em Prêmio Líquido'
					value='0'
					percent={0}
					before='0'
					type='year'
					setType={() => {}}
				/>
				<CardHeaderHome
					isPending={false}
					icon={HomeIcon}
					title='Comissão'
					value='0'
					percent={0}
					before='0'
					type='year'
					setType={() => {}}
				/>
				<CardHeaderHome
					isPending={false}
					icon={HomeIcon}
					title='Média em Comissão'
					value='0'
					percent={0}
					before='0'
					type='year'
					setType={() => {}}
				/>
			</div>
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='text-left w-60'>Segurado</TableHead>
									<TableHead className='text-left flex-1'>Dados</TableHead>
									<TableHead className='text-center w-40'>Tipo</TableHead>
									<TableHead className='text-center w-30'>Seguradora</TableHead>
									<TableHead className='text-center w-60'>Comissão</TableHead>
									<TableHead className='text-center w-40'>
										Final da Vigência
									</TableHead>
									<TableHead className='text-right w-20'>Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map(
									({
										id,
										modality,
										renewal,
										insured,
										vehicle,
										validaty,
										payments,
									}) => (
										<TableRow key={id}>
											<TableCell className='text-left w-60'>
												<div className='flex flex-row items-center justify-start gap-x-2'>
													<Avatar className='size-8 border'>
														<AvatarImage
															src={insured.image}
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
															{insured.phone}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell className='text-left flex-1'>
												<div className='flex flex-row items-center justify-start gap-x-3'>
													<Avatar className='size-8 rounded-none bg-background'>
														<AvatarImage
															src={`https://xcarcorretora.com.br/_next/image?url=https%3A%2F%2Fapiplacas.com.br%2Flogos%2FlogosMarcas%2F${vehicle.manufacturer.toLowerCase()}.png&w=64&q=100`}
															width={52}
															height={52}
															alt='Marca do veículo'
															priority
														/>
														<AvatarFallback>
															{insured.name.slice(0, 2).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className='relative'>
														<span className='block text-sm font-medium truncate line-clamp-1 capitalize'>
															{vehicle.model}
														</span>
														<span className='block text-xs text-muted-foreground font-normal leading-none uppercase'>
															{vehicle.plate}
														</span>
														{renewal && (
															<AwardIcon className='size-3 absolute top-0 -right-4 text-active' />
														)}
													</div>
												</div>
											</TableCell>
											<TableCell className='text-center w-40'>
												<Badge className='dark:border-input'>
													{modality === 'car' && <CarIcon className='size-4' />}
													{modality === 'car' && translateModality(modality)}
												</Badge>
											</TableCell>
											<TableCell className='w-30'>
												<Avatar className='size-8 rounded-none mx-auto'>
													<AvatarImage
														src='https://xcarcorretora.com.br/_next/image?url=https%3A%2F%2Feerbunnlzzosgfxsuskw.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Finsurers%2F79c00f92-05e3-4569-8ad8-f3f31b24fbe8%2Flogo&w=64&q=100'
														width={52}
														height={52}
														alt='Seguradora'
														priority
													/>
													<AvatarFallback>
														{insured.name.slice(0, 2).toUpperCase()}
													</AvatarFallback>
												</Avatar>
											</TableCell>
											<TableCell className='w-60'>
												<div className=' divide-x flex flex-row items-center justify-center'>
													<div className='text-right pr-2'>
														<span className='block text-xs font-medium'>
															R$ 1.821,57 | 20%
														</span>
														<span className='block text-xs text-[0.7rem] font-normal text-muted-foreground'>
															comissão: R$ 364,31
														</span>
													</div>
													<span className='pl-2 text-sm'>
														{payments.installments}x
													</span>
												</div>
											</TableCell>
											<TableCell className='text-center w-40'>
												<span className='block text-xs font-medium'>
													{format(validaty, 'dd/MM/yyyy')}
												</span>
												<span className='block text-xs text-[0.7rem] font-normal text-muted-foreground'>
													{formatDistanceToNow(validaty, {
														addSuffix: true,
													})
														.replace('em', '')
														.trim()}
												</span>
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
									),
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
				<div className='flex flex-row items-center justify-between **:gap-x-2'>
					<div>
						<span className='text-sm px-2 text-muted-foreground'>
							Total: 10 registros
						</span>
					</div>
					<div className='flex flex-row items-center justify-end'>
						<div className='flex flex-row items-center justify-end gap-x-1'>
							<span className='text-sm font-normal leading-none text-muted-foreground'>
								Registros:
							</span>
							<Select defaultValue='10'>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='center'>
									<SelectItem value='10'>10</SelectItem>
									<SelectItem value='20'>20</SelectItem>
									<SelectItem value='30'>30</SelectItem>
									<SelectItem value='50'>50</SelectItem>
									<SelectItem value='100'>100</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Separator orientation='vertical' className='h-7 mx-2' />
						<Pagination>
							<PaginationContent>
								<PaginationPrevious />
								<PaginationEllipsis />
								<PaginationLink>1</PaginationLink>
								<PaginationLink>2</PaginationLink>
								<PaginationLink>3</PaginationLink>
								<PaginationEllipsis />
								<PaginationNext />
							</PaginationContent>
						</Pagination>
					</div>
				</div>
			</div>
		</main>
	);
}

export default PoliciesPage;
