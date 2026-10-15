import type { Metadata } from 'next';
import { connection } from 'next/server';
import { FormProposalRegister } from '@/containers/forms/proposals/register';

export const metadata: Metadata = {
	title: 'Cadastrar Proposta',
};

async function ProposalsRegisterPage() {
	await connection();

	return (
		<main className='grid grid-cols-1 gap-6 mt-1 mb-10'>
			<FormProposalRegister key={Date.now()} />
		</main>
	);
}

export default ProposalsRegisterPage;
