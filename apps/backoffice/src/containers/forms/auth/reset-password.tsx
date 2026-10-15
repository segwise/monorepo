'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { PasswordMustContain } from '@/containers/forms/auth/password-must-contain';
import { SchemaAuthResetPassword } from '@/schemas/auth/reset-password';

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

export { FormResetPassword };
