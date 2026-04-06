import { InputSearch } from '@/components/input-search';
import { Separator } from '@/components/ui/separator';
import { TableInsuranceCompaniesSimple } from '@/containers/tables/insurance-companies/simple';

function InsuranceCompanyPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2'>
					<InputSearch />
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2' />
			</div>
			<Separator />
			<TableInsuranceCompaniesSimple />
		</main>
	);
}

export default InsuranceCompanyPage;
