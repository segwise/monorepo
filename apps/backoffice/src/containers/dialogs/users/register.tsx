'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { StaffRole } from '@segwise/core';
import { maskCPF, maskPhone } from '@segwise/core/masks';
import { SchemaUserRegister } from '@segwise/core/schemas';
import type { UserRegister } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { SaveIcon, XCircleIcon } from 'lucide-react';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { UserRoleGrid } from '@/containers/users/role-grid';
import { useUsersRegister } from '@/libraries/hooks/users/use-users';

function DialogUserRegister({
	assignableRoles,
	children,
}: React.PropsWithChildren<{ assignableRoles: Array<StaffRole> }>) {
	const [open, setOpen] = useState<boolean>(false);

	const { mutate, isPending } = useUsersRegister();

	const { control, handleSubmit, reset } = useForm<
		UserRegister,
		unknown,
		UserRegister
	>({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaUserRegister) as never,
		defaultValues: {
			name: '',
			email: '',
			cpf: '',
			phone: '',
			role: undefined as never,
		},
	});

	function onSubmit(props: UserRegister) {
		mutate(props, {
			onSuccess(data) {
				// Cadastro novo envia convite; e-mail de excluído restaura o acesso.
				toast.success(
					data.message.toUpperCase(),
					/restaurado/i.test(data.message)
						? undefined
						: {
								description:
									'A pessoa define a senha pelo link enviado ao e-mail',
							},
				);

				setOpen(false);
				reset();
			},
			onError(error) {
				toast.error(error.message || 'Falha ao cadastrar usuário');
			},
		});
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				reset();
			}}
		>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-w-3xl'>
				<DialogHeader>
					<DialogTitle>Cadastrar Novo Usuário</DialogTitle>
					<DialogDescription>
						A pessoa recebe um e-mail para criar a senha e acessar o sistema
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='grid grid-cols-1 sm:grid-cols-2 gap-4'
				>
					<Controller
						control={control}
						name='name'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='name'>Nome:</FieldLabel>
								<Input
									{...field}
									id='name'
									aria-invalid={fieldState.invalid}
									placeholder='Nome completo'
									onChange={({ target: { value } }) =>
										field.onChange(capitalizeFirstLetters(value))
									}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='email'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='email'>E-mail:</FieldLabel>
								<Input
									{...field}
									id='email'
									type='email'
									aria-invalid={fieldState.invalid}
									placeholder='email@exemplo.com'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='cpf'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='cpf'>CPF:</FieldLabel>
								<Input
									{...field}
									value={field.value || ''}
									id='cpf'
									aria-invalid={fieldState.invalid}
									placeholder='000.000.000-00'
									maxLength={14}
									onChange={({ target: { value } }) =>
										field.onChange(maskCPF(value))
									}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='phone'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='phone'>Celular:</FieldLabel>
								<Input
									{...field}
									value={field.value || ''}
									id='phone'
									aria-invalid={fieldState.invalid}
									placeholder='(00) 00000-0000'
									onChange={({ target: { value } }) =>
										field.onChange(maskPhone(value))
									}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='role'
						render={({ field, fieldState }) => (
							<Field
								data-invalid={fieldState.invalid}
								className='sm:col-span-2'
							>
								<FieldLabel>Perfil:</FieldLabel>
								<UserRoleGrid
									value={field.value}
									onChange={field.onChange}
									options={assignableRoles}
									invalid={fieldState.invalid}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</form>
				<Separator />
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='destructive' tabIndex={-1}>
							Fechar <XCircleIcon />
						</Button>
					</DialogClose>
					<Button
						isPending={isPending}
						textPending='Enviando'
						onClick={handleSubmit(onSubmit)}
					>
						Cadastrar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogUserRegister };
