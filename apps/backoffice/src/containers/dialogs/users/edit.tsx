'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { StaffRole } from '@segwise/core';
import { maskCPF, maskPhone } from '@segwise/core/masks';
import { SchemaUserUpdate } from '@segwise/core/schemas';
import type { UserListItem, UserUpdate } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { SaveIcon, XCircleIcon } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { UserRoleGrid } from '@/containers/users/role-grid';
import { useUsersUpdate } from '@/libraries/hooks/users/use-users';

function DialogUserEdit({
	user,
	assignableRoles,
	open,
	onOpenChange,
}: {
	user: UserListItem;
	assignableRoles: Array<StaffRole>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate, isPending } = useUsersUpdate(user.id);

	const { control, handleSubmit } = useForm<UserUpdate, unknown, UserUpdate>({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaUserUpdate) as never,
		defaultValues: {
			name: capitalizeFirstLetters(user.name ?? ''),
			cpf: user.cpf ? maskCPF(user.cpf) : '',
			phone: user.phone ? maskPhone(user.phone) : '',
			role: user.role as UserUpdate['role'],
		},
	});

	function onSubmit(props: UserUpdate) {
		mutate(props, {
			onSuccess() {
				toast.success('USUÁRIO ATUALIZADO COM SUCESSO!');

				onOpenChange(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao atualizar usuário');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-3xl'>
				<DialogHeader>
					<DialogTitle>Editar Usuário</DialogTitle>
					<DialogDescription>{user.email}</DialogDescription>
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
						textPending='Salvando'
						onClick={handleSubmit(onSubmit)}
					>
						Salvar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogUserEdit };
