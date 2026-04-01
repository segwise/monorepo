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
	TableHeaderFilters,
	TableHeaderFiltersCount,
} from '@/containers/tables/policies/filters/header';
import { TableSheetFilters } from '@/containers/tables/policies/filters/sheet';
import { TablePoliciesSimple } from '@/containers/tables/policies/simple';

export const metadata: Metadata = {
	title: 'Apólices',
};

function PoliciesPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2'>
					<InputSearch />
					<TableHeaderFilters />
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<TableSheetFilters>
						<Button variant='outline' className='dark:bg-primary'>
							<FilterIcon /> Filtrar <TableHeaderFiltersCount />
						</Button>
					</TableSheetFilters>
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
				<CardAnalyticsStatusCount title='Total Geral' type='safes' />
				<CardAnalyticsStatus
					type='safes'
					status='canceled'
					title='Cancelados'
				/>
				<CardAnalyticsStatus
					type='safes'
					status='suspended'
					title='Suspensos'
				/>
				<CardAnalyticsStatus type='safes' status='active' title='Ativos' />
			</div>
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<TablePoliciesSimple />
					</CardContent>
				</Card>
				<TablePagination type='policies' />
			</div>
		</main>
	);
}

export default PoliciesPage;
