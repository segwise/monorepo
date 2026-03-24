import { FilterIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { TableInsuranceCompaniesSimple } from '@/containers/tables/insurance-companies/simple';

function InsuranceCompanyPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2'>
					<InputGroup className='w-60'>
						<InputGroupInput placeholder='Pesquisar...' />
						<InputGroupAddon align='inline-end'>
							<InputGroupButton
								variant='default'
								size='icon-sm'
								className='size-10 -mr-2 rounded-l-none text-white'
							>
								<SearchIcon />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<Button variant='outline' className='dark:bg-primary'>
						<FilterIcon /> Filtrar{' '}
						{/* <Badge
							variant='active'
							className='size-4 text-[0.6rem] items-center justify-center pointer-events-none'
						>
							1
						</Badge> */}
					</Button>
				</div>
			</div>
			<Separator />
			<TableInsuranceCompaniesSimple />
		</main>
	);
}

export default InsuranceCompanyPage;
