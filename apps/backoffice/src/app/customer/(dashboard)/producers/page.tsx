import { FilterIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { InputSearch } from '@/components/input-search';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DialogProducerRegister } from '@/containers/dialogs/producers/register';
import { TablePagination } from '@/containers/tables/pagination';
import { TableProducersSimple } from '@/containers/tables/producers/simple';

export const metadata: Metadata = {
	title: 'Produtores',
};

function ProducersPage() {
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
					<DialogProducerRegister>
						<Button variant='outline' className='dark:bg-primary'>
							<PlusIcon /> Cadastrar
						</Button>
					</DialogProducerRegister>
				</div>
			</div>
			<Separator />
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<TableProducersSimple />
					</CardContent>
				</Card>
				<TablePagination type='producers' />
			</div>
		</main>
	);
}

export default ProducersPage;
