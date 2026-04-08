import {
	FilterIcon,
	MoreHorizontalIcon,
	PlusIcon,
	PrinterIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { InputSearch } from '@/components/input-search';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { CardAnalyticsStatusCount } from '@/containers/cards/analytics/status/count';
import { CardAnalyticsStatus } from '@/containers/cards/analytics/status/status';
import { FilterBasisOfAnalysis } from '@/containers/tables/filter-base-of-analytics';
import { TablePagination } from '@/containers/tables/pagination';
import {
	TableSafesHeaderFilters,
	TableSafesHeaderFiltersCount,
} from '@/containers/tables/safes/filters/header';
import { TableSafesSheetFilters } from '@/containers/tables/safes/filters/sheet';
import { TableSafesSimple } from '@/containers/tables/safes/simple';

export const metadata: Metadata = {
	title: 'Propostas',
};

function ProposalsPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2'>
					<InputSearch />
					<TableSafesHeaderFilters />
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<TableSafesSheetFilters>
						<Button variant='outline' className='dark:bg-primary'>
							<FilterIcon /> Filtrar <TableSafesHeaderFiltersCount />
						</Button>
					</TableSafesSheetFilters>
					<ButtonGroup>
						<Button asChild variant='outline' className='dark:bg-primary'>
							<Link href='/proposals/register'>
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
			<div className='grid grid-cols-4 gap-x-3'>
				<FilterBasisOfAnalysis className='col-span-full' />
				<CardAnalyticsStatusCount title='Total Geral' type='proposals' />
				<CardAnalyticsStatus
					type='proposals'
					status='canceled'
					title='Cancelados'
				/>
				<CardAnalyticsStatus
					type='proposals'
					status='suspended'
					title='Suspensos'
				/>
				<CardAnalyticsStatus type='proposals' status='active' title='Ativos' />
			</div>
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<TableSafesSimple type='proposals' />
					</CardContent>
				</Card>
				<TablePagination type='proposals' />
			</div>
		</main>
	);
}

export default ProposalsPage;
