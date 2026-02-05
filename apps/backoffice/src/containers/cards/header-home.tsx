import { ArrowUpIcon, ArrowUpRightIcon, type HomeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

interface CardHeaderHomeProps {
	icon?: typeof HomeIcon;
	title: string;
	value: string;
	percent: number;
}

function CardHeaderHome({
	icon: Icon,
	title,
	value,
	percent,
}: CardHeaderHomeProps) {
	return (
		<Card className='p-0 bg-muted/50'>
			<Card className='border-0 border-b py-4'>
				<CardHeader className='relative -mb-5'>
					<CardTitle className='flex flex-row items-center justify-start gap-x-2 text-sm text-muted-foreground font-medium'>
						{Icon && <Icon className='size-5' />}
						{title}
					</CardTitle>
					<CardAction>
						<ArrowUpRightIcon className='text-active' />
					</CardAction>
				</CardHeader>
				<CardContent>
					<span className='text-4xl font-semibold'>{value}</span>
				</CardContent>
			</Card>
			<CardFooter className='pb-2 -mt-4 flex flex-row items-center justify-between'>
				<span className='text-xs font-medium text-muted-foreground/80'>
					Do mês anterior
				</span>
				<Badge>
					<ArrowUpIcon />{' '}
					{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
						percent / 100,
					)}
				</Badge>
			</CardFooter>
		</Card>
	);
}

export { CardHeaderHome };
