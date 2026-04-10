'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	SchemaPasswordIncludeNumber,
	SchemaPasswordIncludeSpecial,
	SchemaPasswordIncludeUppercase,
	SchemaPasswordLengthMin,
} from '@segwise/core/schemas';
import { CheckCircleIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { AcceptInvitation } from '@/@types/auth/accept-invitation';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAcceptInvitation } from '@/libraries/hooks/auth/use-accept-invitation';
import { SchemaAuthAcceptInvitation } from '@/libraries/schemas/auth/accept-invitation';
import { cn } from '@/utils';

function FormAcceptInvitation() {
	const router = useRouter();

	const searchParams = useSearchParams();

	const token = searchParams.get('token') as string;

	const { mutate, isPending } = useAcceptInvitation();

	const form = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaAuthAcceptInvitation),
		defaultValues: {
			token,
			password: '',
			passwordConfirm: '',
		},
	});

	const password = form.watch('password');

	const { isValid, isDirty } = form.formState;
	const isSubmit = isValid && isDirty;

	function handler(props: AcceptInvitation) {
		toast.dismiss();

		mutate(props, {
			onSuccess() {
				toast.success('Senha adicionada com sucesso!', {
					description: 'Você será redirecionado para fazer seu login',
				});

				router.replace('/');
			},
			onError(error) {
				toast.error(error.message.toUpperCase());
			},
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handler)} className='space-y-6'>
				<FormField
					control={form.control}
					name='password'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Senha</FormLabel>
							<FormControl>
								<Input {...field} autoComplete='off' type='password' />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='passwordConfirm'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirmar senha</FormLabel>
							<FormControl>
								<Input {...field} autoComplete='off' type='password' />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Separator />
				<PasswordMustContain value={password} />
				<Button
					className='w-full'
					type='submit'
					disabled={!isSubmit}
					isPending={isPending}
					textPending='Confirmando'
				>
					Confirmar
				</Button>
			</form>
		</Form>
	);
}

function PasswordMustContain({ value }: { value: string }) {
	const isMin = SchemaPasswordLengthMin.safeParse(value).success;
	const isUppercase = SchemaPasswordIncludeUppercase.safeParse(value).success;
	const isNumber = SchemaPasswordIncludeNumber.safeParse(value).success;
	const isSpecial = SchemaPasswordIncludeSpecial.safeParse(value).success;

	return (
		<div className='space-y-2'>
			<Label className='mb-3'>Sua senha deve conter:</Label>
			<ul className='space-y-2'>
				<li
					className={cn(
						'flex items-center gap-1 text-xs text-muted-foreground',
						isMin && '[&_svg]:text-green-600 text-inheret',
					)}
				>
					<CheckCircleIcon className='size-3' />
					Mínimo de 8 caracteres
				</li>
				<li
					className={cn(
						'flex items-center gap-1 text-xs text-muted-foreground',
						isUppercase && '[&_svg]:text-green-600 text-inheret',
					)}
				>
					<CheckCircleIcon className='size-3' />
					Pelo menos uma letra maiúscula
				</li>
				<li
					className={cn(
						'flex items-center gap-1 text-xs text-muted-foreground',
						isNumber && '[&_svg]:text-green-600 text-inheret',
					)}
				>
					<CheckCircleIcon className='size-3' />
					Pelo menos um número
				</li>
				<li
					className={cn(
						'flex items-center gap-1 text-xs text-muted-foreground',
						isSpecial && '[&_svg]:text-green-600 text-inheret',
					)}
				>
					<CheckCircleIcon className='size-3' />
					Pelo menos um número
				</li>
			</ul>
		</div>
	);
}

export { FormAcceptInvitation };
