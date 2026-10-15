'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
	{ month: 'Janeiro', desktop: 186, mobile: 80 },
	{ month: 'February', desktop: 305, mobile: 200 },
	{ month: 'March', desktop: 237, mobile: 120 },
	{ month: 'April', desktop: 73, mobile: 190 },
	{ month: 'May', desktop: 209, mobile: 130 },
	{ month: 'June', desktop: 214, mobile: 140 },
];

const chartConfig = {
	desktop: {
		label: 'Desktop',
		color: 'var(--active)',
	},
	mobile: {
		label: 'Mobile',
		color: 'color-mix(in srgb, var(--active) 70%, transparent)',
	},
} satisfies ChartConfig;

function ChartInsuranceAnalysisAndQuotes() {
	return (
		<ChartContainer config={chartConfig} className='aspect-auto h-62.5 w-full'>
			<AreaChart
				accessibilityLayer
				data={chartData}
				margin={{
					left: 0,
					top: 0,
					right: 0,
					bottom: 0,
				}}
			>
				<CartesianGrid vertical={false} />
				<YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
				<XAxis
					dataKey='month'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => value.slice(0, 3)}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent className='dark' />}
				/>
				<defs>
					<linearGradient id='fillDesktop' x1='0' y1='0' x2='0' y2='1'>
						<stop
							offset='5%'
							stopColor='var(--color-desktop)'
							stopOpacity={0.8}
						/>
						<stop
							offset='95%'
							stopColor='var(--color-desktop)'
							stopOpacity={0.1}
						/>
					</linearGradient>
					<linearGradient id='fillMobile' x1='0' y1='0' x2='0' y2='1'>
						<stop
							offset='5%'
							stopColor='var(--color-mobile)'
							stopOpacity={0.8}
						/>
						<stop
							offset='95%'
							stopColor='var(--color-mobile)'
							stopOpacity={0.1}
						/>
					</linearGradient>
				</defs>
				<Area
					stackId='a'
					dataKey='mobile'
					type='natural'
					fill='url(#fillMobile)'
					fillOpacity={0.4}
					stroke='var(--color-mobile)'
				/>
				<Area
					stackId='a'
					dataKey='desktop'
					type='natural'
					fill='url(#fillDesktop)'
					fillOpacity={0.4}
					stroke='var(--color-desktop)'
				/>
			</AreaChart>
		</ChartContainer>
	);
}

export { ChartInsuranceAnalysisAndQuotes };
