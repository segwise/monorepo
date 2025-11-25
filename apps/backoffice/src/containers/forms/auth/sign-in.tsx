'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { SchemaAuthSignIn } from '@/libraries/schemas/auth/sign-in';

function FormSignIn() {
	const router = useRouter();

	const form = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaAuthSignIn),
		defaultValues: {
			email: '',
			password: '',
			remember_password: false,
		},
	});

	const isSubmit = !(!form.formState.isValid || !form.formState.isDirty);

	function handler(_: SignIn) {
		router.push('/');
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
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className='flex items-center justify-between'>
					<FormField
						control={form.control}
						name='remember_password'
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
						className='text-sm font-normal underline underline-offset-4'
					>
						Esqueceu a senha?
					</Link>
				</div>
				<Button className='w-full' type='submit' disabled={!isSubmit}>
					Entrar
				</Button>
			</form>
		</Form>
	);
}

export { FormSignIn };
