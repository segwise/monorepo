import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { CardActiveBrokers } from '@/containers/cards/active-brokers';
import { CardActiveInsurance } from '@/containers/cards/active-insurance';
import { CardLeadsCaptured } from '@/containers/cards/leads-captured';
import { CardOverview } from '@/containers/cards/overview-card';
import { CardPendingQuotes } from '@/containers/cards/pending-quotes';
import { Chart1 } from '@/containers/charts/chart-1';

function DashboardPage() {
	return (
		<main className='grid gap-4'>
			<CardOverview />
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<CardActiveBrokers />
				<CardLeadsCaptured />
				<CardPendingQuotes />
				<CardActiveInsurance />
			</div>
			<div className='grid grid-cols-1 md:grid-cols-[70%_auto] gap-4'>
				<Card>
					<CardHeader>
						<CardTitle>Employee Attendance Summary</CardTitle>
						<CardAction>
							<div className='flex flex-row items-center justify-end gap-x-4'>
								<div className='flex flex-row items-center justify-start gap-x-2 text-sm font-medium text-muted-foreground/70'>
									<div className='size-2.5 bg-primary rounded-full' /> Employee
									present
								</div>
								<div className='flex flex-row items-center justify-start gap-x-2 text-sm font-medium text-muted-foreground/70'>
									<div className='size-2.5 bg-primary/70 rounded-full' />{' '}
									Employee absent
								</div>
							</div>
						</CardAction>
					</CardHeader>
					<CardContent>
						<div className='flex flex-row items-center justify-start gap-x-5'>
							<div>
								<span className='block text-muted-foreground/70 text-sm font-medium'>
									Employee present
								</span>
								<div className='mt-1'>
									<span className='font-semibold text-4xl mr-1.5'>250</span>
									<Badge variant='success'>
										<ArrowUpIcon />{' '}
										{new Intl.NumberFormat('pt-BR', {
											style: 'percent',
										}).format(5 / 100)}
									</Badge>
								</div>
							</div>
							<Separator orientation='vertical' className='h-14' />
							<div>
								<span className='block text-muted-foreground/70 text-sm font-medium'>
									Employee present
								</span>
								<div className='mt-1'>
									<span className='font-semibold text-4xl mr-1.5'>250</span>
									<Badge variant='destructive'>
										<ArrowDownIcon />{' '}
										{new Intl.NumberFormat('pt-BR', {
											style: 'percent',
										}).format(5 / 100)}
									</Badge>
								</div>
							</div>
						</div>
						<br />
						<Chart1 />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Document Submission</CardTitle>
					</CardHeader>
				</Card>
			</div>
		</main>
	);
}

export default DashboardPage;
