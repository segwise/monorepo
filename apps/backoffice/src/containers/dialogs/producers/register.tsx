'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone } from '@segwise/core/masks';
import { SchemaProducerRegister } from '@segwise/core/schemas';
import type { ProducerRegister } from '@segwise/core/types';
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
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useProducersRegister } from '@/libraries/hooks/producers/use-producers-register';

function DialogProducerRegister({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);

	const { mutate, isPending } = useProducersRegister();

	const { control, handleSubmit } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerRegister),
		defaultValues: {
			name: '',
			phone: '',
			email: '',
		},
	});

	function onSubmit(props: ProducerRegister) {
		mutate(props, {
			async onSuccess(_data, _variables, _mutate, ctx) {
				toast.success('CADASTRADO COM SUCESSO!');

				await Promise.all([
					ctx.client.invalidateQueries({
						queryKey: ['producers', 'simple'],
					}),
					ctx.client.invalidateQueries({
						queryKey: ['producers', 'simple', 'full'],
					}),
				]);

				setOpen(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao cadastrar registro');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cadastrar Novo Produtor</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
				</DialogHeader>
				<Separator />
				<form onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup className='gap-4'>
						<Controller
							control={control}
							name='name'
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor='name'>Nome Completo:</FieldLabel>
									<Input
										{...field}
										id='name'
										aria-invalid={fieldState.invalid}
										placeholder='Nome Completo'
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
						<FieldGroup className='grid grid-cols-2 gap-4'>
							<Controller
								control={control}
								name='email'
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor='email'>E-mail</FieldLabel>
										<Input
											{...field}
											id='email'
											aria-invalid={fieldState.invalid}
											placeholder='exemplo@hospedage.com'
											className='lowercase'
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
						</FieldGroup>
					</FieldGroup>
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
						textPending='Confirmando'
						onClick={handleSubmit(onSubmit)}
					>
						Confirmar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogProducerRegister };
