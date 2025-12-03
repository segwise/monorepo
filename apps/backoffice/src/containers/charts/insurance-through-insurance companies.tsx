'use client';

import { useState } from 'react';
import { Label, Pie, PieChart, Sector } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

export const description = 'A donut chart with text';

const chartData = [
	{ browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
	{ browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
	{ browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
	{ browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
	{ browser: 'other', visitors: 190, fill: 'var(--color-other)' },
];

const chartConfig = {
	visitors: {
		label: 'Seguros',
	},
	chrome: {
		label: 'Chrome',
		color: 'var(--active)',
	},
	safari: {
		label: 'Safari',
		color: 'color-mix(in srgb, var(--active) 80%, transparent)',
	},
	firefox: {
		label: 'Firefox',
		color: 'color-mix(in srgb, var(--active) 60%, transparent)',
	},
	edge: {
		label: 'Edge',
		color: 'color-mix(in srgb, var(--active) 40%, transparent)',
	},
	other: {
		label: 'Other',
		color: 'color-mix(in srgb, var(--active) 20%, transparent)',
	},
} satisfies ChartConfig;

function ChartInsuranceThroughInsuranceCompanies() {
	const [activeIndex, setActiveIndex] = useState<number>(-1);

	const totalVisitors = chartData.reduce((acc, curr) => acc + curr.visitors, 0);

	function renderActiveShape({
		cx,
		cy,
		innerRadius,
		outerRadius,
		startAngle,
		endAngle,
		fill,
		// biome-ignore lint/suspicious/noExplicitAny: ActiveShape<PieSectorDataItem>
	}: any) {
		return (
			<g>
				<Sector
					cx={cx}
					cy={cy}
					innerRadius={innerRadius}
					outerRadius={outerRadius + 15}
					startAngle={startAngle}
					endAngle={endAngle}
					fill={fill}
					stroke='#fff'
					strokeWidth={3}
				/>
			</g>
		);
	}

	return (
		<ChartContainer config={chartConfig} className='aspect-square'>
			<PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent className='dark' />}
				/>
				<Pie
					data={chartData}
					dataKey='visitors'
					nameKey='browser'
					cx='50%'
					cy='100%'
					innerRadius='65%'
					outerRadius='100%'
					startAngle={180}
					endAngle={0}
					paddingAngle={1.5}
					activeIndex={activeIndex}
					activeShape={renderActiveShape}
					// biome-ignore lint/suspicious/noExplicitAny: onMouseEnter
					onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
					onMouseLeave={() => setActiveIndex(-1)}
				>
					<Label
						content={({ viewBox }) => {
							if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
								return (
									<text
										x={viewBox.cx}
										y={viewBox.cy}
										textAnchor='middle'
										dominantBaseline='middle'
									>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) - 40}
											className='fill-foreground text-3xl font-bold'
										>
											{totalVisitors.toLocaleString('pt-BR')}
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) - 15}
											className='fill-muted-foreground'
										>
											Total de seguros
										</tspan>
									</text>
								);
							}
						}}
					/>
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

export { ChartInsuranceThroughInsuranceCompanies };
