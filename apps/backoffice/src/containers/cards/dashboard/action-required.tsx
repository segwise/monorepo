'use client';

import {
	AlertTriangleIcon,
	CalendarClockIcon,
	ChevronRightIcon,
	ClockIcon,
	FileCheckIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActionRequiredKind } from '@/hooks/analytics/use-action-required';
import { useActionRequired } from '@/hooks/analytics/use-action-required';
import { cn } from '@/libraries/utils';

const KIND_ICON: Record<ActionRequiredKind, typeof AlertTriangleIcon> = {
	'quote-stalled': ClockIcon,
	'policy-expiring': CalendarClockIcon,
	'quote-awaiting-customer': FileCheckIcon,
	'payment-overdue': AlertTriangleIcon,
};

function CardActionRequired() {
	const { data, isPending } = useActionRequired();

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex flex-row items-center gap-x-2'>
					Ação Necessária
					{!isPending && !!data?.totalCount && (
						<Badge variant='destructive'>{data.totalCount}</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className='grid grid-cols-1 md:grid-cols-2 gap-2'>
				{isPending &&
					Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index.toString()} className='h-14 rounded-lg' />
					))}
				{!isPending &&
					data?.groups.map((group) => {
						const Icon = KIND_ICON[group.kind];

						return (
							<Link
								key={group.kind}
								href={group.href}
								className='flex flex-row items-center justify-between gap-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors'
							>
								<div className='flex flex-row items-center gap-x-3'>
									<div className='flex size-9 items-center justify-center rounded-full bg-muted'>
										<Icon className='size-4.5 text-muted-foreground' />
									</div>
									<span
										className={cn(
											'text-sm font-medium',
											!group.count && 'text-muted-foreground',
										)}
									>
										{group.title}
									</span>
								</div>
								<div className='flex flex-row items-center gap-x-1'>
									<span className='text-sm font-semibold tabular-nums'>
										{group.count}
									</span>
									<ChevronRightIcon className='size-4 text-muted-foreground' />
								</div>
							</Link>
						);
					})}
				{!isPending && data?.totalCount === 0 && (
					<p className='col-span-full text-sm text-muted-foreground py-6 text-center'>
						Nenhuma pendência no momento. Tudo em dia.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

export { CardActionRequired };
