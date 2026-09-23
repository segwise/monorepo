import { FilterIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { InputSearch } from '@/components/input-search';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogProducerRegister } from '@/containers/dialogs/producers/register';
import { ButtonCopyProducerPublicLink } from '@/containers/producers/button-copy-public-link';
import { TablePagination } from '@/containers/tables/pagination';
import { TableProducersSimple } from '@/containers/tables/producers/simple';

export const metadata: Metadata = {
	title: 'Produtores',
};

function ProducersPage() {
	return (
		<main className='grid grid-cols-1 gap-6 max-sm:gap-3 mt-1'>
			<div className='flex flex-row max-sm:flex-col max-sm:space-y-2 sm:items-center sm:justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2 max-sm:w-full'>
					<InputSearch className='max-sm:w-full' />
				</div>
				<div className='flex flex-row items-center sm:justify-end gap-x-2'>
					<Button variant='outline' className='dark:bg-primary max-sm:flex-1'>
						<FilterIcon /> Filtrar
					</Button>
					<ButtonCopyProducerPublicLink />
					<DialogProducerRegister>
						<Button className='max-sm:flex-1'>
							<PlusIcon /> Cadastrar
						</Button>
					</DialogProducerRegister>
				</div>
			</div>
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
