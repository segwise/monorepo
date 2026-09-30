import type { Metadata } from 'next';
import { FormProposalRegister } from '@/containers/forms/proposals/register';

export async function generateMetadata(
	props: PageProps<'/customer/proposals/[id]'>,
): Promise<Metadata> {
	const searchParams = await props.searchParams;

	const renewal = searchParams?.renewal === 'true';

	return {
		title: renewal ? 'Ajuste Geral' : 'Renovação de Proposta',
	};
}

async function ProposalsDetailsPage(
	props: PageProps<'/customer/proposals/[id]'>,
) {
	const { id } = await props.params;

	return (
		<main className='grid grid-cols-1 gap-6 mt-1 mb-10'>
			<FormProposalRegister id={id} />
		</main>
	);
}

export default ProposalsDetailsPage;
