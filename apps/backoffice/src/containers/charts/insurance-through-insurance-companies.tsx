'use client';

import { useState } from 'react';
import { Label, Pie, PieChart, Sector } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import type { InsuranceDistributionItem } from '@/hooks/analytics/use-insurance-distribution';

// Cada fatia é a cor de destaque com opacidade decrescente.
const OPACITIES = [100, 80, 60, 40, 25, 15];

function ChartInsuranceThroughInsuranceCompanies({
	items,
	total,
}: {
	items: Array<InsuranceDistributionItem>;
	total: number;
}) {
	const [activeIndex, setActiveIndex] = useState<number>(-1);

	const chartData = items.map((item, index) => ({
		key: `company-${index}`,
		name: item.name,
		total: item.total,
		fill: `var(--color-company-${index})`,
	}));

	const chartConfig = {
		total: { label: 'Seguros' },
		...Object.fromEntries(
			chartData.map((item, index) => [
				item.key,
				{
					label: item.name,
					color: `color-mix(in srgb, var(--active) ${OPACITIES[index] ?? 15}%, transparent)`,
				},
			]),
		),
	} satisfies ChartConfig;

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
					content={<ChartTooltipContent className='dark' nameKey='key' />}
				/>
				<Pie
					data={chartData}
					dataKey='total'
					nameKey='key'
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
											{total.toLocaleString('pt-BR')}
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) - 15}
											className='fill-muted-foreground'
										>
											Apólices no período
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
