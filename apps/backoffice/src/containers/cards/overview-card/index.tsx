import { Card, CardAction, CardHeader } from '@/components/ui/card';
import { ComparisonToggle } from './comparison-toggle';
import { CardDescription } from './description';
import { SelectPeriod } from './select-period';
import { CardTitle } from './title';

function CardOverview() {
	return (
		<Card>
			<CardHeader className='max-sm:grid-cols-1! gap-y-3'>
				<CardTitle />
				<CardDescription />
				<CardAction className='flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-2 max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:w-full'>
					<ComparisonToggle />
					<SelectPeriod />
				</CardAction>
			</CardHeader>
		</Card>
	);
}

export { CardOverview };
