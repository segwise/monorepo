'use client';

import {
	AlertTriangleIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	HandCoinsIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialSummary } from '@/hooks/analytics/use-financial-summary';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function CardFinancialSummary() {
	const { data, isPending } = useFinancialSummary();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Resumo Financeiro</CardTitle>
				<CardAction>
					<Link
						href='/finance'
						className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
					>
						Ver detalhes
					</Link>
				</CardAction>
			</CardHeader>
			<CardContent className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<div className='flex flex-row items-center gap-x-3'>
					<div className='flex size-10 items-center justify-center rounded-full bg-muted'>
						<ArrowUpIcon className='size-4.5 text-active' />
					</div>
					<div>
						<span className='block text-xs text-muted-foreground/70 font-medium'>
							A receber (30 dias)
						</span>
						{isPending ? (
							<Skeleton className='w-24 h-6 rounded mt-1' />
						) : (
							<span className='text-lg font-semibold'>
								{currency(data?.receivableNext30Days ?? 0)}
							</span>
						)}
					</div>
				</div>
				<div className='flex flex-row items-center gap-x-3'>
					<div className='flex size-10 items-center justify-center rounded-full bg-muted'>
						<ArrowDownIcon className='size-4.5 text-muted-foreground' />
					</div>
					<div>
						<span className='block text-xs text-muted-foreground/70 font-medium'>
							A pagar (30 dias)
						</span>
						{isPending ? (
							<Skeleton className='w-24 h-6 rounded mt-1' />
						) : (
							<span className='text-lg font-semibold'>
								{currency(data?.payableNext30Days ?? 0)}
							</span>
						)}
					</div>
				</div>
				<div className='flex flex-row items-center gap-x-3'>
					<div className='flex size-10 items-center justify-center rounded-full bg-muted'>
						<HandCoinsIcon className='size-4.5 text-active' />
					</div>
					<div>
						<span className='block text-xs text-muted-foreground/70 font-medium'>
							Comissões a receber
						</span>
						{isPending ? (
							<Skeleton className='w-24 h-6 rounded mt-1' />
						) : (
							<span className='text-lg font-semibold'>
								{currency(data?.pendingCommissionFromInsurers ?? 0)}
							</span>
						)}
					</div>
				</div>
				<div className='flex flex-row items-center gap-x-3'>
					<div className='flex size-10 items-center justify-center rounded-full bg-muted'>
						<AlertTriangleIcon className='size-4.5 text-destructive' />
					</div>
					<div>
						<span className='block text-xs text-muted-foreground/70 font-medium'>
							Recebimentos em atraso
						</span>
						{isPending ? (
							<Skeleton className='w-24 h-6 rounded mt-1' />
						) : (
							<span className='text-lg font-semibold'>
								{currency(data?.overdueReceivable ?? 0)}
							</span>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export { CardFinancialSummary };
