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
			<CardHeader>
				<Suspense>
					<CardTitle />
				</Suspense>
				<CardDescription>
					Relatórios e atividades registradas no sistema de controle.
				</CardDescription>
				<CardAction className='flex flex-row items-center justify-end gap-x-2'>
					<Button variant='outline'>
						<FilterIcon /> Filtrar
					</Button>
					<SelectMonth />
				</CardAction>
			</CardHeader>
		</Card>
	);
}

export { CardOverview };
