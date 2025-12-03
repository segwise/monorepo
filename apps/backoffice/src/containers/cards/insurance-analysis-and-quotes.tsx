import { ArrowUpIcon } from 'lucide-react';
import { ChartInsuranceAnalysisAndQuotes } from '@/charts/insurance-analysis-and-quotes';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function CardInsuranceAnalysisAndQuotes() {
	return (
		<Card>
			<CardHeader className='-mb-4'>
				<CardTitle>Análise de seguros e cotações</CardTitle>
				<CardAction>
					<div className='flex flex-row items-center justify-end gap-x-4'>
						<div className='flex flex-row items-center justify-start gap-x-2 text-sm font-medium text-muted-foreground/70'>
							<div className='size-2.5 bg-active rounded-full' /> Seguros
						</div>
						<div className='flex flex-row items-center justify-start gap-x-2 text-sm font-medium text-muted-foreground/70'>
							<div className='size-2.5 bg-active/70 rounded-full' /> Cotações
						</div>
					</div>
				</CardAction>
			</CardHeader>
			<CardContent>
				<div className='flex flex-row items-center justify-start gap-x-5'>
					<div>
						<span className='block text-muted-foreground/70 text-sm font-medium'>
							Seguros
						</span>
						<div className='mt-1'>
							<span className='font-semibold text-4xl mr-2'>0</span>
							<Badge>
								<ArrowUpIcon />{' '}
								{new Intl.NumberFormat('pt-BR', {
									style: 'percent',
								}).format(0)}
							</Badge>
						</div>
					</div>
					<Separator orientation='vertical' className='h-14' />
					<div>
						<span className='block text-muted-foreground/70 text-sm font-medium'>
							Cotações
						</span>
						<div className='mt-1'>
							<span className='font-semibold text-4xl mr-2'>0</span>
							<Badge>
								<ArrowUpIcon />{' '}
								{new Intl.NumberFormat('pt-BR', {
									style: 'percent',
								}).format(0)}
							</Badge>
						</div>
					</div>
				</div>
				<br />
				<ChartInsuranceAnalysisAndQuotes />
			</CardContent>
		</Card>
	);
}

export { CardInsuranceAnalysisAndQuotes };
