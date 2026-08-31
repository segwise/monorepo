'use client';

import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeriodFilter } from '@/containers/cards/dashboard/period-filter';
import { useNextPeriodProjection } from '@/hooks/analytics/use-next-period-projection';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function CardNextPeriodProjection() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useNextPeriodProjection('net-premium', resolved);

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex flex-row items-center gap-x-2'>
					<TrendingUpIcon className='size-4.5 text-muted-foreground' />
					Projeção — {data?.periodLabel ?? '...'}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isPending && <Skeleton className='w-40 h-9 rounded' />}
				{!isPending && data && (
					<>
						<div className='flex flex-row items-center gap-x-3'>
							<span className='font-semibold text-3xl'>
								{currency(data.projectedValue)}
							</span>
							<Badge variant={data.growthRate >= 0 ? 'success' : 'destructive'}>
								{data.growthRate >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}{' '}
								{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
									Math.abs(data.growthRate),
								)}
							</Badge>
						</div>
						<span className='block text-xs text-muted-foreground/70 mt-1'>
							Baseado no período atual: {currency(data.currentPeriodValue)}
						</span>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export { CardNextPeriodProjection };
