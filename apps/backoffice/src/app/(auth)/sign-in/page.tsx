import { FormSignIn } from '@/containers/forms/auth/sign-in';

function SingnInPage() {
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
							Fazer Login
						</h1>
						<p className='text-muted-foreground font-medium text-sm leading-none'>
							Informe as credenciais para acesso
						</p>
					</div>
					<FormSignIn />
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

export default SingnInPage;
