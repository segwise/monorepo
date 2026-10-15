import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { brand } from '@/config/brand';
import { FormAcceptInvitation } from '@/containers/forms/auth/accept-invitation';
import { getCurrentYear } from '@/functions/date/get-current-year-cache';

export const metadata: Metadata = {
	title: 'Aceitar Convite - Segwise',
};

function AcceptInvitationdPage() {
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
						<h1 className='text-2xl font-bold leading-none mb-1'>
							Criar senha de acesso
						</h1>
						<p className='text-muted-foreground font-medium text-sm leading-none'>
							Informe senha senha para acessar seu perfil
						</p>
					</div>
					<Suspense>
						<FormAcceptInvitation />
					</Suspense>
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

export default AcceptInvitationdPage;
