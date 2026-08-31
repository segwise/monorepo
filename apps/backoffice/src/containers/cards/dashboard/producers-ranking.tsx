'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useProducersRanking } from '@/hooks/analytics/use-producers-ranking';
import { usePeriodFilter } from './period-filter';

const currency = (value: number) =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0,
	}).format(value);

function initials(name: string) {
	return name
		.split(' ')
		.slice(0, 2)
		.map((part) => part[0])
		.join('')
		.toUpperCase();
}

function CardProducersRanking() {
	const { resolved } = usePeriodFilter();
	const { data, isPending } = useProducersRanking(resolved, 5);

	return (
		<Card className='pb-3 md:pb-4'>
			<CardHeader>
				<CardTitle>Ranking de Produtores</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader className='[&_tr]:border-b-0 [&_tr]:[&_th]:h-6 [&_tr]:text-xs [&_tr]:[&_th]:text-muted-foreground/70 [&_tr]:[&_th]:p-0'>
						<TableRow>
							<TableHead className='text-left'>Produtor</TableHead>
							<TableHead className='text-center'>Apólices</TableHead>
							<TableHead className='text-right'>Comissão</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isPending &&
							Array.from({ length: 5 }).map((_, index) => (
								<TableRow
									className='[&_td]:px-0 [&_td]:py-2'
									key={index.toString()}
								>
									<TableCell colSpan={3}>
										<Skeleton className='w-full h-8 rounded' />
									</TableCell>
								</TableRow>
							))}
						{!isPending &&
							data?.items.map((producer, index) => (
								<TableRow
									className='text-xs [&_td]:px-0 [&_td]:py-2'
									key={producer.id}
								>
									<TableCell className='text-left'>
										<div className='flex flex-row items-center gap-x-2'>
											<span className='text-muted-foreground/70 tabular-nums w-4'>
												{index + 1}
											</span>
											<Avatar className='size-6'>
												<AvatarImage
													src={producer.avatarUrl as string}
													alt={producer.name}
													width={512}
													height={512}
												/>
												<AvatarFallback className='text-[10px]'>
													{initials(producer.name)}
												</AvatarFallback>
											</Avatar>
											{producer.name}
										</div>
									</TableCell>
									<TableCell className='text-center tabular-nums'>
										{producer.policiesClosed}
									</TableCell>
									<TableCell className='text-right font-medium tabular-nums'>
										{currency(producer.commissionGenerated)}
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

export { CardProducersRanking };
