import { redirect } from 'next/navigation';

// Apólice deixou de ser uma tela separada: tudo é proposta.
function PoliciesPage() {
	redirect('/proposals');
}

export default PoliciesPage;
