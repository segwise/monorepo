'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import type { MetricSeriesPoint } from '@/hooks/analytics/use-insurance-metrics';

interface ChartInsuranceComparisonProps {
	currentSeries: Array<MetricSeriesPoint>;
	referenceSeries: Array<MetricSeriesPoint>;
	comparisonLabel: string;
	valueFormatter?: (value: number) => string;
}

const chartConfig = {
	current: {
		label: 'Período atual',
		color: 'var(--active)',
	},
	reference: {
		label: 'Referência',
		color: 'color-mix(in srgb, var(--active) 40%, transparent)',
	},
} satisfies ChartConfig;

function ChartInsuranceComparison({
	currentSeries,
	referenceSeries,
	comparisonLabel,
}: ChartInsuranceComparisonProps) {
	// Alinha as duas séries por posição relativa dentro do período (dia 1, dia
	// 2, ...), não por data real — necessário pra sobrepor YoY, onde as datas
	// são de anos diferentes.
	const length = Math.max(currentSeries.length, referenceSeries.length);
	const data = Array.from({ length }, (_, index) => ({
		index: index + 1,
		current: currentSeries[index]?.value ?? null,
		reference: referenceSeries[index]?.value ?? null,
	}));

	return (
		<ChartContainer config={chartConfig} className='aspect-auto h-62.5 w-full'>
			<AreaChart
				accessibilityLayer
				data={data}
				margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
			>
				<CartesianGrid vertical={false} />
				<YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
				<XAxis
					dataKey='index'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => `D${value}`}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent className='dark' />}
					labelFormatter={(value) => `Dia ${value} do período`}
				/>
				<defs>
					<linearGradient id='fillCurrent' x1='0' y1='0' x2='0' y2='1'>
						<stop
							offset='5%'
							stopColor='var(--color-current)'
							stopOpacity={0.8}
						/>
						<stop
							offset='95%'
							stopColor='var(--color-current)'
							stopOpacity={0.1}
						/>
					</linearGradient>
					<linearGradient id='fillReference' x1='0' y1='0' x2='0' y2='1'>
						<stop
							offset='5%'
							stopColor='var(--color-reference)'
							stopOpacity={0.6}
						/>
						<stop
							offset='95%'
							stopColor='var(--color-reference)'
							stopOpacity={0.05}
						/>
					</linearGradient>
				</defs>
				<Area
					dataKey='reference'
					name={comparisonLabel}
					type='natural'
					fill='url(#fillReference)'
					fillOpacity={0.4}
					stroke='var(--color-reference)'
					strokeDasharray='4 4'
					connectNulls
				/>
				<Area
					dataKey='current'
					name='Período atual'
					type='natural'
					fill='url(#fillCurrent)'
					fillOpacity={0.4}
					stroke='var(--color-current)'
					connectNulls
				/>
			</AreaChart>
		</ChartContainer>
	);
}

export { ChartInsuranceComparison };
