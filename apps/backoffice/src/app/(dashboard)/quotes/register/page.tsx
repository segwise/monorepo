import { ChevronLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ButtonBack } from '@/components/ui/button/back';
import { FormQuoteRegister } from '@/containers/forms/quotes/register';

export const metadata: Metadata = {
	title: 'Cadastrar Cotação',
};

function QuotesRegisterPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1 mb-10'>
			<div className='flex flex-row items-center justify-between **:gap-x-2'>
				<div />
				<div className='flex flex-row items-center justify-end'>
					<ButtonBack>
						<Button>
							<ChevronLeftIcon /> Voltar
						</Button>
					</ButtonBack>
				</div>
			</div>
			<FormQuoteRegister />
		</main>
	);
}

export default QuotesRegisterPage;
