import {
	ArrowDownRightIcon,
	ArrowUpIcon,
	ArrowUpRightIcon,
	ChevronsUpDownIcon,
	type HomeIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CardHeaderHomeProps {
	isPending: boolean;
	icon?: typeof HomeIcon;
	title: string;
	value: string;
	percent: number;
	type: 'year' | 'month';
	setType: (type: 'year' | 'month') => void;
}

function CardHeaderHome({
	isPending,
	icon: Icon,
	title,
	value,
	percent,
	type,
	setType,
}: CardHeaderHomeProps) {
	return (
		<Card className='p-0 bg-muted/50'>
			<Card className='border-0 border-b py-4'>
				<CardHeader className='relative -mb-5'>
					<CardTitle className='flex flex-row items-center justify-start gap-x-2 text-sm text-muted-foreground font-medium'>
						{!!isPending && <Skeleton className='size-5 rounded' />}
						{!!isPending && <Skeleton className='w-20 h-4 rounded' />}
						{!isPending && Icon && <Icon className='size-5' />}
						{!isPending && title}
					</CardTitle>
					<CardAction>
						{!!isPending && <Skeleton className='size-5 rounded' />}
						{!isPending && percent > 0 && (
							<ArrowUpRightIcon className='text-active' />
						)}
						{!isPending && percent < 0 && (
							<ArrowDownRightIcon className='text-active' />
						)}
					</CardAction>
				</CardHeader>
				<CardContent>
					{!!isPending && <Skeleton className='w-28 h-10 rounded' />}
					{!isPending && (
						<span className='text-4xl font-semibold'>{value}</span>
					)}
				</CardContent>
			</Card>
			<CardFooter className='pb-2 -mt-4 flex flex-row items-center justify-between'>
				{!!isPending && <Skeleton className='w-22 h-3 rounded' />}
				{!isPending && (
					// biome-ignore lint/a11y/noStaticElementInteractions: span
					// biome-ignore lint/a11y/useKeyWithClickEvents: span
					<div
						className='text-xs font-medium text-muted-foreground/80 flex flex-row items-center justify-start gap-x-1 cursor-pointer w-fit'
						onClick={() => setType(type === 'year' ? 'month' : 'year')}
					>
						<span>
							Do{' '}
							<span className='underline'>
								{type === 'year' ? 'ano' : 'mês'}
							</span>{' '}
							anterior
						</span>
						<ChevronsUpDownIcon className='size-3.5' />
					</div>
				)}
				{!!isPending && <Skeleton className='w-14 h-5 rounded-full' />}
				{!isPending && (
					<Badge
						variant={
							percent === 0
								? 'default'
								: percent < 0
									? 'destructive'
									: 'success'
						}
					>
						<ArrowUpIcon />{' '}
						{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
							percent,
						)}
					</Badge>
				)}
			</CardFooter>
		</Card>
	);
}

export { CardHeaderHome };
