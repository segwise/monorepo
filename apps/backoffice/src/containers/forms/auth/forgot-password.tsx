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
import { useForgotPassword } from '@/libraries/hooks/auth/forgot-password';
import { SchemaAuthForgotPassword } from '@/libraries/schemas/auth/forgot-password';

function FormForgotPassword() {
	const router = useRouter();

	const { mutate, isPending } = useForgotPassword();

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
	const isSubmit = !isPending && isValid && isDirty;

	function handler({ email }: ForgotPassword) {
		toast.dismiss();

		mutate(
			{ email },
			{
				onSuccess() {
					toast.success('E-mail enviado com sucesso!');

					router.push('/');
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
