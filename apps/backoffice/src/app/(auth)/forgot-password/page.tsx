import { ArrowLeftIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { brand } from '@/config/brand';
import { FormForgotPassword } from '@/containers/forms/auth/forgot-password';

function ForgotPasswordPage() {
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
							Esqueceu sua senha
						</h1>
						<p className='text-muted-foreground font-medium text-sm leading-none'>
							Sem problemas. Enviaremos instruções para redefinir sua senha.
						</p>
					</div>
					<FormForgotPassword />
					<div className='mt-6'>
						<Link
							href='/sign-in'
							className='flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-inherit hover:underline hover:underline-offset-4 transition-colors'
						>
							<ArrowLeftIcon className='size-4' />
							Voltar para login
						</Link>
					</div>
					<div className='mt-12 text-center text-sm text-muted-foreground'>
						<p>
							© {new Date().getUTCFullYear()} {brand.name}. Todos os direitos
							reservados.
						</p>
					</div>
				</div>
			</div>
			<div className='hidden lg:block relative bg-primary' />
		</div>
	);
}

export default ForgotPasswordPage;
