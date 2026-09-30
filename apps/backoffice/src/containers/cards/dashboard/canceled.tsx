'use client';

import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import { ArrowDownIcon, ArrowUpIcon, BanIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { useCanceled } from '@/hooks/analytics/use-canceled';
import { usePeriodFilter } from './period-filter';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

// Para cancelamentos, subir é ruim: a cor é invertida.
function VariationBadge({ percent }: { percent: number }) {
	if (percent === 0) {
		return null;
	}

	return (
		<Badge variant={percent > 0 ? 'destructive' : 'success'}>
			{percent > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}{' '}
			{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
				Math.abs(percent),
			)}
		</Badge>
	);
}

function CardCanceled() {
	const { resolved, comparisonMode } = usePeriodFilter();
	const { data, isPending } = useCanceled(resolved, 8);

	const comparisonLabel =
		comparisonMode === 'yoy'
			? 'Mesmo período, ano anterior'
			: 'Período anterior';

	return (
		<Card className='pb-3 md:pb-4'>
			<CardHeader>
				<CardTitle className='flex flex-row items-center gap-x-2'>
					<BanIcon className='size-4.5 text-muted-foreground' />
					Propostas Canceladas
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
					<div>
						<span className='block text-xs text-muted-foreground/70 font-medium'>
							Canceladas no período
						</span>
						{isPending && <Skeleton className='w-24 h-9 rounded mt-1' />}
						{!isPending && data && (
							<>
								<div className='flex flex-row items-center gap-x-3'>
									<span className='font-semibold text-3xl'>
										{data.count.current}
									</span>
									<VariationBadge percent={data.count.percent} />
								</div>
								<span className='block text-xs text-muted-foreground/70 mt-0.5'>
									{comparisonLabel}: {data.count.reference}
								</span>
							</>
						)}
					</div>
					<div>
						<span className='block text-xs text-muted-foreground/70 font-medium'>
							Prêmio líquido perdido
						</span>
						{isPending && <Skeleton className='w-32 h-9 rounded mt-1' />}
						{!isPending && data && (
							<>
								<div className='flex flex-row items-center gap-x-3'>
									<span className='font-semibold text-3xl'>
										{currency(data.premium.current)}
									</span>
									<VariationBadge percent={data.premium.percent} />
								</div>
								<span className='block text-xs text-muted-foreground/70 mt-0.5'>
									{comparisonLabel}: {currency(data.premium.reference)}
								</span>
							</>
						)}
					</div>
				</div>

				<Table>
					<TableHeader className='[&_tr]:border-b-0 [&_tr]:[&_th]:h-6 [&_tr]:text-xs [&_tr]:[&_th]:text-muted-foreground/70 [&_tr]:[&_th]:p-0'>
						<TableRow>
							<TableHead className='text-left'>Segurado</TableHead>
							<TableHead className='text-left max-md:hidden'>
								Seguradora
							</TableHead>
							<TableHead className='text-right'>Prêmio</TableHead>
							<TableHead className='text-right'>Cancelada em</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isPending &&
							Array.from({ length: 4 }).map((_, index) => (
								<TableRow
									className='[&_td]:px-0 [&_td]:py-2'
									key={index.toString()}
								>
									<TableCell colSpan={4}>
										<Skeleton className='w-full h-8 rounded' />
									</TableCell>
								</TableRow>
							))}
						{!isPending && !data?.items.length && (
							<TableRow className='hover:bg-transparent'>
								<TableCell
									colSpan={4}
									className='text-center py-8 text-sm text-muted-foreground'
								>
									Nenhuma proposta cancelada no período
								</TableCell>
							</TableRow>
						)}
						{!isPending &&
							data?.items.map((item) => (
								<TableRow
									className='text-xs [&_td]:px-0 [&_td]:py-2'
									key={item.id}
								>
									<TableCell className='text-left'>
										<span className='block font-medium truncate max-w-56'>
											{capitalizeFirstLetters(item.insured)}
										</span>
										<span className='block text-muted-foreground/70'>
											{[item.plate?.toUpperCase(), item.reason]
												.filter(Boolean)
												.join(' · ')}
										</span>
									</TableCell>
									<TableCell className='text-left max-md:hidden'>
										{item.insuranceCompany
											? capitalizeFirstLetters(item.insuranceCompany)
											: '-'}
									</TableCell>
									<TableCell className='text-right font-medium tabular-nums'>
										{currency(item.premium)}
									</TableCell>
									<TableCell className='text-right tabular-nums'>
										{format(new Date(item.canceledAt), 'dd/MM/yyyy')}
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

export { CardCanceled };
