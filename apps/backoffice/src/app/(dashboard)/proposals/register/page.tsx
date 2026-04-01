import type { Metadata } from 'next';
import { FormProposalRegister } from '@/containers/forms/proposals/register';

export const metadata: Metadata = {
	title: 'Cadastrar Apólice',
};

function ProposalsRegisterPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1 mb-10'>
			<FormProposalRegister />
		</main>
	);
}

export default ProposalsRegisterPage;
