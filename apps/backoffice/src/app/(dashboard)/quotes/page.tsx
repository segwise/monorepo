import { FilterIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { InputSearch } from '@/components/input-search';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CardQuotesCountAnalytics } from '@/containers/cards/quotes/count-analytics';
import { CardQuotesStatusAnalytics } from '@/containers/cards/quotes/status-analytics';
import { SheetFilters } from '@/containers/sheets/filters';
import { TableFilters, TableFiltersCount } from '@/containers/tables/filters';
import { TablePagination } from '@/containers/tables/pagination';
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
					<TableFilters
						type='quotes'
						filters={[
							'producers',
							'insuranceCompanies',
							'requestAt',
							'modality',
							'status',
						]}
					/>
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<SheetFilters
						type='quotes'
						filters={[
							'producers',
							'insuranceCompanies',
							'requestAt',
							'modality',
							'status',
						]}
					>
						<Button variant='outline' className='dark:bg-primary'>
							<FilterIcon /> Filtrar <TableFiltersCount />
						</Button>
					</SheetFilters>
					<Button asChild variant='outline' className='dark:bg-primary'>
						<Link href='/quotes/register'>
							<PlusIcon /> Cadastrar
						</Link>
					</Button>
				</div>
			</div>
			<Separator />
			<div className='grid grid-cols-5 gap-x-3'>
				<CardQuotesCountAnalytics title='Total Geral' />
				<CardQuotesStatusAnalytics status='waiting' title='Pendentes' />
				<CardQuotesStatusAnalytics
					status={['quoting', 'quoted', 'sent']}
					title='Em Andamento'
				/>
				<CardQuotesStatusAnalytics status='recused' title='Recusados' />
				<CardQuotesStatusAnalytics status='confirmed' title='Confirmados' />
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
