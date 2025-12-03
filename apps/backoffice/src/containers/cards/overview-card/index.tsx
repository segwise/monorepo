import { FilterIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
} from '@/components/ui/card';
import { SelectMonth } from './select-month';
import { CardTitle } from './title';

function CardOverview() {
	return (
		<Card>
			<CardHeader className='max-sm:grid-cols-1!'>
				<Suspense>
					<CardTitle />
				</Suspense>
				<CardDescription>
					Relatórios e atividades registradas no sistema de controle.
				</CardDescription>
				<CardAction className='flex flex-row items-center justify-end gap-x-2 max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:w-full'>
					<Button variant='outline' className='max-sm:w-full!'>
						<FilterIcon /> Filtrar
					</Button>
					<SelectMonth />
				</CardAction>
			</CardHeader>
		</Card>
	);
}

export { CardOverview };
