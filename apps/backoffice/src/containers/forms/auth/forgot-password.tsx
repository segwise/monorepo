'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ForgotPassword } from '@/@types/auth/forgot-password';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SchemaAuthForgotPassword } from '@/libraries/schemas/auth/forgot-password';

function FormForgotPassword() {
	const router = useRouter();

	const form = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaAuthForgotPassword),
		defaultValues: {
			email: '',
		},
	});

	const { isDirty, isValid } = form.formState;
	const isSubmit = isValid && isDirty;

	function handler(_: ForgotPassword) {
		const id = 'forgot-password';

		const toasts = toast
			.getToasts()
			.flatMap((toast) => toast.id)
			.filter((current) => current !== id);

		for (const id of toasts) {
			toast.dismiss(id);
		}

		toast.success('E-mail enviado com sucesso!', {
			id,
			description:
				'Verifique sua caixa de e-mail para confirmar o link de redefinição de senha.',
			duration: Infinity,
		});

		router.push('/sign-in');
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
								<Input
									{...field}
									placeholder='Digite seu e-mail'
									autoComplete='off'
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className='w-full' type='submit' disabled={!isSubmit}>
					Enviar
				</Button>
			</form>
		</Form>
	);
}

export { FormForgotPassword };
