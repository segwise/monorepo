'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRoundIcon, SaveIcon, XCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/containers/forms/auth/password-input';
import { PasswordMustContain } from '@/containers/forms/auth/password-must-contain';
import { useChangePassword } from '@/libraries/hooks/auth/use-change-password';
import {
	type AuthChangePassword,
	SchemaAuthChangePassword,
} from '@/schemas/auth/change-password';

const SAME_AS_CURRENT = 'A nova senha deve ser diferente da atual';

const DEFAULTS: AuthChangePassword = {
	currentPassword: '',
	password: '',
	passwordConfirm: '',
	revokeOtherSessions: true,
};

// Troca de senha de quem está logado. Abre pelo menu do perfil (avatar), disponível
// em todas as telas, sem ocupar espaço na página.
// Aceita `open`/`onOpenChange` para quem abre por fora (ex.: item de menu que também
// precisa fechar o menu); com `children` ele mesmo traz o gatilho.
function DialogChangePassword({
	children,
	open: openProp,
	onOpenChange: onOpenChangeProp,
}: React.PropsWithChildren<{
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}>) {
	const [openState, setOpenState] = useState<boolean>(false);

	const open = openProp ?? openState;

	const { mutate, isPending, reset: resetMutation } = useChangePassword();

	const {
		control,
		watch,
		handleSubmit,
		reset,
		setError,
		formState: { isValid },
	} = useForm<AuthChangePassword>({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaAuthChangePassword),
		defaultValues: DEFAULTS,
	});

	const password = watch('password');

	function onOpenChange(next: boolean) {
		setOpenState(next);
		onOpenChangeProp?.(next);

		if (!next) {
			// As senhas digitadas não ficam no formulário nem no cache da mutation.
			reset(DEFAULTS);
			resetMutation();
		}
	}

	function onSubmit({
		currentPassword,
		password,
		revokeOtherSessions,
	}: AuthChangePassword) {
		toast.dismiss();

		mutate(
			{ currentPassword, newPassword: password, revokeOtherSessions },
			{
				onSuccess() {
					toast.success('SENHA ALTERADA COM SUCESSO!', {
						description: revokeOtherSessions
							? 'Os outros dispositivos foram desconectados.'
							: undefined,
					});

					onOpenChange(false);
				},
				onError(error) {
					if (error.message === 'Senha atual incorreta') {
						setError('currentPassword', { message: error.message });

						return;
					}

					toast.error(error.message.toUpperCase());
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{children && <DialogTrigger asChild>{children}</DialogTrigger>}
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex flex-row items-center gap-x-2'>
						<KeyRoundIcon className='size-5' /> Alterar senha
					</DialogTitle>
					<DialogDescription>
						Use uma senha forte que você não usa em outros lugares.
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<form
					onSubmit={handleSubmit(onSubmit)}
					noValidate
					className='space-y-4'
				>
					<FieldGroup className='gap-4'>
						<Controller
							control={control}
							name='currentPassword'
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor='current-password'>
										Senha atual:
									</FieldLabel>
									<PasswordInput
										{...field}
										id='current-password'
										autoComplete='current-password'
										aria-invalid={fieldState.invalid}
										placeholder='Digite sua senha atual'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Separator />
						<Controller
							control={control}
							name='password'
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor='new-password'>Nova senha:</FieldLabel>
									<PasswordInput
										{...field}
										id='new-password'
										autoComplete='new-password'
										aria-invalid={fieldState.invalid}
										placeholder='Crie a nova senha'
									/>
									{/* As regras de força aparecem no checklist abaixo; aqui só o
									    aviso de senha repetida. */}
									{fieldState.error?.message === SAME_AS_CURRENT && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<PasswordMustContain value={password} />
						<Controller
							control={control}
							name='passwordConfirm'
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor='confirm-password'>
										Confirmar nova senha:
									</FieldLabel>
									<PasswordInput
										{...field}
										id='confirm-password'
										autoComplete='new-password'
										aria-invalid={fieldState.invalid}
										placeholder='Repita a nova senha'
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							control={control}
							name='revokeOtherSessions'
							render={({ field }) => (
								<Field orientation='horizontal' className='items-start'>
									<Switch
										id='revoke-sessions'
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
									<div className='space-y-0.5'>
										<FieldLabel htmlFor='revoke-sessions'>
											Sair dos outros dispositivos
										</FieldLabel>
										<FieldDescription className='text-xs'>
											Recomendado: encerra o acesso em outros aparelhos e
											navegadores.
										</FieldDescription>
									</div>
								</Field>
							)}
						/>
					</FieldGroup>
					<Separator />
					<DialogFooter>
						<DialogClose asChild>
							<Button type='button' variant='destructive' tabIndex={-1}>
								Cancelar <XCircleIcon />
							</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={!isValid}
							isPending={isPending}
							textPending='Alterando'
						>
							Alterar senha <SaveIcon />
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export { DialogChangePassword };
