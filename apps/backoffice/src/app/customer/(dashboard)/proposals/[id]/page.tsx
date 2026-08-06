import type { Metadata } from 'next';
import { FormProposalRegister } from '@/containers/forms/proposals/register';

export async function generateMetadata(
	props: PageProps<'/customer/proposals/[id]'>,
): Promise<Metadata> {
	const searchParams = await props.searchParams;

	const renewal = searchParams?.renewal === 'true';

	return {
		title: renewal ? 'Ajuste Geral' : 'Renovação de Apólice',
	};
}

async function ProposalsRegisterPage(
	props: PageProps<'/customer/proposals/[id]'>,
) {
	const [{ id }, { renewal }] = await Promise.all([
		props.params,
		props.searchParams,
	]);

	return (
		<main className='grid grid-cols-1 gap-6 mt-1 mb-10'>
			<FormProposalRegister id={id} renewal={renewal === 'true'} />
		</main>
	);
}

export default ProposalsRegisterPage;
