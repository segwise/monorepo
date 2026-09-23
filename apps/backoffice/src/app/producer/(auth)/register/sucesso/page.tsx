import { MailCheckIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { brand } from '@/config/brand';
import { getCurrentYear } from '@/functions/date/get-current-year-cache';

export const metadata: Metadata = {
	title: 'Cadastro Recebido - Segwise',
};

function ProducerPublicRegisterSuccessPage() {
	return (
		<div className='min-h-screen grid lg:grid-cols-2'>
			<div className='flex items-center justify-center p-8 lg:p-12'>
				<div className='w-full max-w-md'>
					<div className='mb-4'>
						<div className='flex flex-row items-center justify-start gap-x-2 mb-10'>
							<Image
								src={brand.icon}
								alt={brand.name}
								priority
								quality={100}
								className='aspect-square size-14 object-contain object-center rounded-sm bg-primary'
							/>
							<div className='leading-none'>
								<span className='block text-lg font-bold leading-none mb-1'>
									{brand.name}
								</span>
								<span className='block text-sm font-medium text-muted-foreground leading-none'>
									{brand.slogan}
								</span>
							</div>
						</div>
						<div className='flex flex-col items-center text-center gap-y-4 py-6'>
							<div className='size-24 bg-primary/10 rounded-full items-center justify-center flex'>
								<MailCheckIcon className='size-12 text-primary' />
							</div>
							<div>
								<h1 className='text-lg font-bold leading-none mb-2'>
									Cadastro recebido!
								</h1>
								<p className='text-muted-foreground text-sm leading-relaxed max-w-sm'>
									Enviamos um e-mail de confirmação para você. Abra o link
									recebido para confirmar sua conta e criar sua senha de acesso
									ao painel.
								</p>
							</div>
						</div>
					</div>
					<div className='mt-12 text-center text-sm text-muted-foreground'>
						<p>
							© <Suspense>{getCurrentYear()}</Suspense> {brand.name}. Todos os
							direitos reservados.
						</p>
					</div>
				</div>
			</div>
			<div className='hidden lg:block relative bg-primary' />
		</div>
	);
}

export default ProducerPublicRegisterSuccessPage;
