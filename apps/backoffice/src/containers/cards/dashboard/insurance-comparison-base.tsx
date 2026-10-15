'use client';

import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { ChartInsuranceComparison } from '@/charts/insurance-comparison';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeriodFilter } from '@/containers/cards/dashboard/period-filter';
import type { InsuranceMetricKind } from '@/hooks/analytics/use-insurance-metrics';
import { useInsuranceMetric } from '@/hooks/analytics/use-insurance-metrics';

interface CardInsuranceComparisonBaseProps {
	kind: InsuranceMetricKind;
	title: string;
	valueFormatter: (value: number) => string;
}

function CardInsuranceComparisonBase({
	kind,
	title,
	valueFormatter,
}: CardInsuranceComparisonBaseProps) {
	const { resolved, comparisonMode } = usePeriodFilter();
	const { data, isPending } = useInsuranceMetric(kind, resolved);

	const comparisonLabel =
		comparisonMode === 'yoy'
			? 'Mesmo período, ano anterior'
			: 'Período anterior';

	return (
		<Card className='pb-4 md:pb-4'>
			<CardHeader className='-mb-4'>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='flex flex-row items-center gap-x-3'>
					{isPending && <Skeleton className='w-32 h-9 rounded' />}
					{!isPending && data && (
						<>
							<span className='font-semibold text-3xl'>
								{valueFormatter(data.comparison.current)}
							</span>
							<Badge
								variant={
									data.comparison.percent === 0
										? 'default'
										: data.comparison.percent < 0
											? 'destructive'
											: 'success'
								}
							>
								{data.comparison.percent >= 0 ? (
									<ArrowUpIcon />
								) : (
									<ArrowDownIcon />
								)}{' '}
								{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
									Math.abs(data.comparison.percent),
								)}
							</Badge>
						</>
					)}
				</div>
				<span className='block text-xs text-muted-foreground/70 mt-0.5'>
					{comparisonLabel}
					{!isPending && data
						? `: ${valueFormatter(data.comparison.reference)}`
						: ''}
				</span>

				<div className='mt-4'>
					{isPending && <Skeleton className='h-48 w-full rounded-lg' />}
					{!isPending && data && (
						<ChartInsuranceComparison
							currentSeries={data.currentSeries}
							referenceSeries={data.referenceSeries}
							comparisonLabel={comparisonLabel}
						/>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export { CardInsuranceComparisonBase };
