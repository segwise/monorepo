'use client';

import { ChartInsuranceThroughInsuranceCompanies } from '@/charts/insurance-through-insurance-companies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useInsuranceDistribution } from '@/hooks/analytics/use-insurance-distribution';
import { usePeriodFilter } from './period-filter';

const OPACITIES = [1, 0.8, 0.6, 0.4, 0.25, 0.15];

function CardInsuranceThroughInsuranceCompanies() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useInsuranceDistribution(resolved);

	const hasData = !!data?.items.length;

	return (
		<Card className='pb-3 md:pb-4'>
			<CardHeader className='z-1'>
				<CardTitle>Apólices por Seguradora</CardTitle>
			</CardHeader>
			<CardContent>
				{isPending && <Skeleton className='h-64 w-full rounded-lg' />}
				{!isPending && !hasData && (
					<div className='flex flex-col items-center justify-center gap-y-1 py-12 text-center'>
						<span className='text-sm font-medium'>
							Nenhuma apólice emitida no período
						</span>
						<span className='text-xs text-muted-foreground/70'>
							Assim que houver apólices emitidas, a distribuição por seguradora
							aparece aqui.
						</span>
					</div>
				)}
				{!isPending && data && hasData && (
					<>
						<div className='-mt-42 md:-mt-37 z-0'>
							<ChartInsuranceThroughInsuranceCompanies
								items={data.items}
								total={data.total}
							/>
						</div>
						<Table className='mt-1'>
							<TableHeader className='[&_tr]:border-b-0 [&_tr]:[&_th]:h-6 [&_tr]:text-xs [&_tr]:[&_th]:text-muted-foreground/70 [&_tr]:[&_th]:p-0'>
								<TableRow>
									<TableHead className='text-left'>Seguradora</TableHead>
									<TableHead className='text-center'>Porcentagem</TableHead>
									<TableHead className='text-center'>Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.items.map((item, index) => (
									<TableRow
										className='text-xs [&_td]:px-0 [&_td]:py-2 [&_td]:text-xs'
										key={item.id}
									>
										<TableCell className='text-left flex flex-row items-center justify-start gap-x-2'>
											<div
												className='size-2 rounded-full bg-active'
												style={{ opacity: OPACITIES[index] ?? 0.15 }}
											/>{' '}
											{item.name}
										</TableCell>
										<TableCell className='text-center'>
											{new Intl.NumberFormat('pt-BR', {
												style: 'percent',
												maximumFractionDigits: 1,
											}).format(item.percent)}
										</TableCell>
										<TableCell className='text-center'>
											{item.total.toLocaleString('pt-BR')}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export { CardInsuranceThroughInsuranceCompanies };
