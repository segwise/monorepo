import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardDescription,
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

function LeadsPage() {
	return (
		<main>
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
			<br />
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
		</main>
	);
}

export default LeadsPage;
