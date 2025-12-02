'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
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
		color: 'var(--primary)',
	},
	mobile: {
		label: 'Mobile',
		color: 'color-mix(in srgb, var(--primary) 60%, transparent)',
	},
} satisfies ChartConfig;

function Chart1() {
	return (
		<ChartContainer config={chartConfig}>
			<LineChart
				accessibilityLayer
				data={chartData}
				margin={{
					left: 12,
					right: 12,
				}}
			>
				<CartesianGrid
					vertical={false}
					stroke='#212121'
					strokeDasharray={10}
					strokeOpacity={0.1}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) =>
						new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
						}).format(value)
					}
				/>
				<XAxis
					dataKey='month'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => value.slice(0, 3)}
				/>
				<ChartTooltip
					cursor={true}
					content={<ChartTooltipContent indicator='circle' className='dark' />}
				/>
				<Line
					dataKey='desktop'
					type='linear'
					stroke='var(--color-desktop)'
					strokeWidth={2}
					dot={{
						fill: 'var(--color-desktop)',
						stroke: 'white',
						strokeWidth: 2,
						r: 5,
					}}
					activeDot={{
						fill: 'white',
						stroke: 'var(--color-desktop)',
						strokeWidth: 2,
						r: 6,
					}}
				/>
				<Line
					dataKey='mobile'
					type='linear'
					stroke='var(--color-mobile)'
					strokeWidth={2}
					dot={{
						fill: 'var(--color-mobile)',
						stroke: 'white',
						strokeWidth: 2,
						r: 5,
					}}
					activeDot={{
						fill: 'white',
						stroke: 'var(--color-mobile)',
						strokeWidth: 2,
						r: 6,
					}}
				/>
			</LineChart>
		</ChartContainer>
	);
}

export { Chart1 };
