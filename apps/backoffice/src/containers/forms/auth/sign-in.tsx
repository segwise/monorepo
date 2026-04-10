'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import { useSignIn } from '@/hooks/auth/use-sign-in';
import { SchemaAuthSignIn } from '@/schemas/auth/sign-in';

function FormSignIn() {
	const router = useRouter();

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
				<FormField
					control={form.control}
					name='password'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Senha</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder='Digite sua senha'
									autoComplete='off'
									type='password'
								/>
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
				<Button className='w-full' type='submit' disabled={!isSubmit}>
					<Activity mode={!isPending ? 'visible' : 'hidden'}>Acessar</Activity>
					<Activity mode={isPending ? 'visible' : 'hidden'}>
						Acessando
						<Spinner />
					</Activity>
				</Button>
			</form>
		</Form>
	);
}

export { FormSignIn };
