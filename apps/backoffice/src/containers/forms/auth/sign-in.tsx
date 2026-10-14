'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { SignIn } from '@/@types/auth/sign-in';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import { useSignIn } from '@/hooks/auth/use-sign-in';
import { SchemaAuthSignIn } from '@/schemas/auth/sign-in';

function FormSignIn() {
	const router = useRouter();

	const [showPassword, setShowPassword] = useState<boolean>(false);

	const { mutate, isPending } = useSignIn();

	const form = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaAuthSignIn),
		defaultValues: {
			email: '',
			password: '',
			rememberPassword: false,
		},
	});

	// Retorno do link de confirmação do e-mail (`/accept-invitation` no backend
	// redireciona para cá com o resultado).
	useEffect(() => {
		const outcome = new URL(window.location.href).searchParams.get(
			'invitation',
		);

		if (outcome === 'confirmed') {
			toast.success('ACESSO CONFIRMADO!', {
				description: 'Entre com seu e-mail e a senha informada pela corretora.',
			});
		} else if (outcome === 'used') {
			toast.info('CONVITE JÁ UTILIZADO', {
				description: 'Se você já confirmou, entre com seu e-mail e senha.',
			});
		} else if (outcome === 'expired' || outcome === 'error') {
			toast.error(
				outcome === 'expired'
					? 'CONVITE EXPIRADO'
					: 'NÃO FOI POSSÍVEL CONFIRMAR O ACESSO',
				{ description: 'Peça um novo convite à corretora.' },
			);
		}
	}, []);

	const { isDirty, isValid } = form.formState;
	const isSubmit = !isPending && isValid && isDirty;

	function handler({ email, password, rememberPassword }: SignIn) {
		toast.dismiss();

		mutate(
			{ email, password, rememberPassword },
			{
				onSuccess() {
					const callbackUrl = new URL(window.location.href).searchParams.get(
						'callbackUrl',
					);

					if (callbackUrl) {
						router.replace(callbackUrl);

						return;
					}

					router.replace('/');
				},
				onError(error) {
					toast.error(error.message);
				},
			},
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handler)} className='space-y-6'>
				<FormField
					control={form.control}
					name='email'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input {...field} placeholder='Digite seu e-mail' />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='password'
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Senha</FormLabel>
							<FormControl>
								<InputGroup>
									<InputGroupInput
										{...field}
										id='password'
										type={showPassword ? 'text' : 'password'}
										placeholder='**********'
										aria-invalid={fieldState.invalid}
									/>
									<InputGroupAddon align='inline-end'>
										<InputGroupButton
											size='icon-xs'
											onClick={() => setShowPassword((show) => !show)}
											tabIndex={-1}
										>
											{!showPassword && <EyeIcon />}
											{showPassword && <EyeOffIcon />}
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className='flex items-center justify-between'>
					<FormField
						control={form.control}
						name='rememberPassword'
						render={({ field }) => (
							<FormItem className='flex flex-row items-center justify-start gap-x-2'>
								<FormControl>
									<Checkbox
										checked={!!field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className='font-normal cursor-pointer'>
									Lembrar de mim
								</FormLabel>
							</FormItem>
						)}
					/>
					<Link
						href='/forgot-password'
						className='text-sm underline underline-offset-3'
					>
						Esqueceu a senha?
					</Link>
				</div>
				<Button
					className='w-full'
					type='submit'
					disabled={!isSubmit}
					isPending={isPending}
					textPending='Acessando'
				>
					Acessar
				</Button>
			</form>
		</Form>
	);
}

export { FormSignIn };
