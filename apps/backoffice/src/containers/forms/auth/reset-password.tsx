'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	SchemaPasswordIncludeNumber,
	SchemaPasswordIncludeSpecial,
	SchemaPasswordIncludeUppercase,
	SchemaPasswordLengthMin,
} from '@segwise/core/schemas';
import { CheckCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ResetPassword } from '@/@types/auth/reset-password';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SchemaAuthResetPassword } from '@/schemas/auth/reset-password';
import { cn } from '@/utils';

function FormResetPassword() {
	const router = useRouter();

	const [showPassword, setShowPassword] = useState<boolean>(false);

	const isPending = false;

	const form = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaAuthResetPassword),
		defaultValues: {
			password: '',
			passwordConfirm: '',
		},
	});

	const password = form.watch('password');

	const { isValid, isDirty } = form.formState;
	const isSubmit = isValid && isDirty;

	function handler(_: ResetPassword) {
		toast.dismiss();

		toast.success('Senha alterada com sucesso!', {
			description: 'Você será redirecionado para o dashboard',
		});

		router.replace('/');
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handler)} className='space-y-6'>
				<FormField
					control={form.control}
					name='password'
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Nova senha</FormLabel>
							<FormControl>
								<InputGroup>
									<InputGroupInput
										{...field}
										id='password'
										type={showPassword ? 'text' : 'password'}
										placeholder='**********'
										autoComplete='new-password'
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
				<FormField
					control={form.control}
					name='passwordConfirm'
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Confirmar senha</FormLabel>
							<FormControl>
								<InputGroup>
									<InputGroupInput
										{...field}
										id='password'
										type={showPassword ? 'text' : 'password'}
										placeholder='**********'
										autoComplete='new-password'
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
				<Separator />
				<PasswordMustContain value={password} />
				<Button
					className='w-full'
					type='submit'
					disabled={!isSubmit}
					isPending={isPending}
					textPending='Resetando'
				>
					Redefinir senha
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

export { FormResetPassword };
