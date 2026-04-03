import type { Metadata } from 'next';
import { FormQuoteRegister } from '@/containers/forms/quotes/register';

export const metadata: Metadata = {
	title: 'Cadastrar Cotação',
};

function QuotesRegisterPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1 mb-10'>
			<FormQuoteRegister />
		</main>
	);
}

export default QuotesRegisterPage;
