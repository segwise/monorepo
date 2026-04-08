import { FilterIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { InputSearch } from '@/components/input-search';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TableFinanceSimple } from '@/containers/tables/finance/simple';
import { TablePagination } from '@/containers/tables/pagination';

export const metadata: Metadata = {
	title: 'Fluxo de Caixa',
};

function FinanceCashFlowPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2'>
					<InputSearch />
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<Button variant='outline' className='dark:bg-primary'>
						<FilterIcon /> Filtrar
					</Button>
					<Button variant='outline' className='dark:bg-primary'>
						<PlusIcon /> Cadastrar
					</Button>
				</div>
			</div>
			<Separator />
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<TableFinanceSimple />
					</CardContent>
				</Card>
				<TablePagination type='payments-cash-flow' />
			</div>
		</main>
	);
}

export default FinanceCashFlowPage;
