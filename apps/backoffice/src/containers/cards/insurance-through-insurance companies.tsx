import { ChartInsuranceThroughInsuranceCompanies } from '@/charts/insurance-through-insurance companies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

const chartData = [
	{ browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
	{ browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
	{ browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
	{ browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
	{ browser: 'other', visitors: 190, fill: 'var(--color-other)' },
];

function CardInsuranceThroughInsuranceCompanies() {
	return (
		<Card className='pb-3 md:pb-4'>
			<CardHeader className='z-1'>
				<CardTitle>Seguros por seguradoras</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='-mt-42 md:-mt-37 z-0'>
					<ChartInsuranceThroughInsuranceCompanies />
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
						{chartData.map((_, index) => (
							<TableRow
								className='text-xs [&_td]:px-0 [&_td]:py-2 [&_td]:text-xs'
								key={index.toString()}
							>
								<TableCell className='text-left flex flex-row items-center justify-start gap-x-2'>
									<div
										className='size-2 rounded-full bg-active'
										style={{ opacity: Math.max(0, 1 - index * 0.2) }}
									/>{' '}
									Seguradora {index + 1}
								</TableCell>
								<TableCell className='text-center'>
									{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
										0,
									)}
								</TableCell>
								<TableCell className='text-center'>0</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

export { CardInsuranceThroughInsuranceCompanies };
