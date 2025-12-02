import {
	ArrowUpIcon,
	ArrowUpRight,
	FilterIcon,
	Users2Icon,
} from 'lucide-react';
import { connection } from 'next/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

async function DashboardPage() {
	await connection();

	return (
		<main className='grid gap-4'>
			<Card>
				<CardHeader className='relative'>
					<CardTitle>Welcome, Super Admin instansi</CardTitle>
					<CardDescription>
						Summary and activities of instansi in the controle system.
					</CardDescription>
					<CardAction className='flex flex-row items-center justify-end gap-x-2'>
						<Button variant='outline'>
							<FilterIcon /> Filter
						</Button>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder='Selecione' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='1'>fsdfdsf</SelectItem>
							</SelectContent>
						</Select>
					</CardAction>
				</CardHeader>
			</Card>
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				{Array.from({ length: 4 }).map((_, index) => {
					const badge = Math.floor(Math.random() * 4);

					return (
						<Card key={index.toString()} className='p-0 bg-muted'>
							<Card className='border-0 border-b py-4'>
								<CardHeader className='relative -mb-5'>
									<CardTitle className='flex flex-row items-center justify-start gap-x-2 text-sm text-muted-foreground font-medium'>
										<Users2Icon className='size-5' /> Total Employees
									</CardTitle>
									<CardAction>
										<ArrowUpRight className='text-primary' />
									</CardAction>
								</CardHeader>
								<CardContent>
									<span className='text-4xl font-semibold'>250</span>
								</CardContent>
							</Card>
							<CardFooter className='pb-2 -mt-4 flex flex-row items-center justify-between'>
								<span className='text-xs font-normal text-muted-foreground/80'>
									From Last Month
								</span>
								<Badge
									variant={
										badge === 1
											? 'default'
											: badge === 2
												? 'success'
												: badge === 3
													? 'destructive'
													: 'warning'
									}
								>
									<ArrowUpIcon />{' '}
									{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(
										12.09,
									)}
								</Badge>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		</main>
	);
}

export default DashboardPage;
