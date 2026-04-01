import { FilterIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { InputSearch } from '@/components/input-search';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CardAnalyticsStatusCount } from '@/containers/cards/analytics/status/count';
import { CardAnalyticsStatus } from '@/containers/cards/analytics/status/status';
import { FilterBasisOfAnalysis } from '@/containers/tables/filter-base-of-analytics';
import { TablePagination } from '@/containers/tables/pagination';
import {
	TableHeaderFilters,
	TableHeaderFiltersCount,
} from '@/containers/tables/quotes/filters/header';
import { TableSheetFilters } from '@/containers/tables/quotes/filters/sheet';
import { TableQuotesSimple } from '@/containers/tables/quotes/simple';

export const metadata: Metadata = {
	title: 'Cotações',
};

function QuotesPage() {
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
					<Button asChild variant='outline' className='dark:bg-primary'>
						<Link href='/quotes/register'>
							<PlusIcon /> Cadastrar
						</Link>
					</Button>
				</div>
			</div>
			<Separator />
			<div className='grid grid-cols-5 gap-x-3'>
				<FilterBasisOfAnalysis className='col-span-full' />
				<CardAnalyticsStatusCount title='Total Geral' type='quotes' />
				<CardAnalyticsStatus type='quotes' status='waiting' title='Pendentes' />
				<CardAnalyticsStatus
					type='quotes'
					status={['quoting', 'quoted', 'sent']}
					title='Em Andamento'
				/>
				<CardAnalyticsStatus type='quotes' status='recused' title='Recusados' />
				<CardAnalyticsStatus
					type='quotes'
					status='confirmed'
					title='Confirmados'
				/>
			</div>
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<TableQuotesSimple />
					</CardContent>
				</Card>
				<TablePagination type='quotes' />
			</div>
		</main>
	);
}

export default QuotesPage;
