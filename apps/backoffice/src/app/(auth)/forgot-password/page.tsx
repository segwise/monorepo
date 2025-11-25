import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { FormForgotPassword } from '@/containers/forms/auth/forgot-password';

function ForgotPage() {
	return (
		<div className='min-h-screen grid lg:grid-cols-2'>
			<div className='flex items-center justify-center p-8 lg:p-12'>
				<div className='w-full max-w-md'>
					<div className='mb-4'>
						<div className='flex flex-row items-center justify-start gap-x-2 mb-10'>
							<div className='inline-flex items-center justify-center size-12 rounded-sm bg-primary'>
								<svg
									className='size-6 text-white'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<title>SVG</title>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M13 10V3L4 14h7v7l9-11h-7z'
									/>
								</svg>
							</div>
							<div className='leading-none'>
								<span className='block text-lg font-bold leading-none mb-1'>
									Segwise
								</span>
								<span className='block text-sm font-medium text-muted-foreground leading-none'>
									Gestão de corretoras de seguros
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
							© {new Date().getUTCFullYear()} Segwise. Todos os direitos
							reservados.
						</p>
					</div>
				</div>
			</div>
			<div className='hidden lg:block relative bg-primary' />
		</div>
	);
}

export default ForgotPage;
