'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversionFunnel } from '@/hooks/analytics/use-conversion-funnel';
import { usePeriodFilter } from './period-filter';

function CardConversionFunnel() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useConversionFunnel(resolved);

	const max = data ? Math.max(...data.stages.map((stage) => stage.value)) : 1;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Funil de Conversão</CardTitle>
			</CardHeader>
			<CardContent className='space-y-3'>
				{isPending &&
					Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index.toString()} className='h-8 rounded' />
					))}
				{!isPending &&
					data?.stages.map((stage, index) => {
						const widthPercent = Math.max((stage.value / max) * 100, 12);
						const opacity = Math.max(1 - index * 0.2, 0.3);
						const previous = data.stages[index - 1];
						const dropRate = previous
							? (previous.value - stage.value) / previous.value
							: 0;

						return (
							<div key={stage.stage}>
								<div className='flex flex-row items-center justify-between mb-1'>
									<span className='text-sm font-medium'>{stage.label}</span>
									<div className='flex flex-row items-center gap-x-2'>
										{index > 0 && (
											<span className='text-xs text-muted-foreground/70'>
												-
												{new Intl.NumberFormat('pt-BR', {
													style: 'percent',
												}).format(dropRate)}
											</span>
										)}
										<span className='text-sm font-semibold tabular-nums'>
											{stage.value}
										</span>
									</div>
								</div>
								<div
									className='h-6 rounded-md bg-active'
									style={{ width: `${widthPercent}%`, opacity }}
								/>
							</div>
						);
					})}
			</CardContent>
		</Card>
	);
}

export { CardConversionFunnel };
