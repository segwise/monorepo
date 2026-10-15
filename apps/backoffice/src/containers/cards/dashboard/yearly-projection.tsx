'use client';

import { ArrowDownIcon, ArrowUpIcon, SparklesIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useYearlyProjection } from '@/hooks/analytics/use-yearly-projection';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function CardYearlyProjection() {
	const { data, isPending } = useYearlyProjection('net-premium');

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex flex-row items-center gap-x-2'>
					<SparklesIcon className='size-4.5 text-muted-foreground' />
					Projeção de Prêmio Líquido — {data?.targetYear ?? ''}
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
							Acumulado deste ano: {currency(data.currentYearAccumulated)}
						</span>
						<span className='block text-xs text-muted-foreground/70'>
							Base: últimos 12 meses com o crescimento anual aplicado (limite de
							±30%).
						</span>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export { CardYearlyProjection };
