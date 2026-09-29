'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone } from '@segwise/core/masks';
import { SchemaMarketingContact } from '@segwise/core/schemas';
import type { MarketingContactInput } from '@segwise/core/types';
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
import { useMarketingContactAdd } from '@/libraries/hooks/marketing/use-marketing';

function DialogMarketingContact({
	campaignId,
	open,
	onOpenChange,
}: {
	campaignId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate, isPending } = useMarketingContactAdd(campaignId);

	const { control, handleSubmit, reset } = useForm<
		MarketingContactInput,
		unknown,
		MarketingContactInput
	>({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaMarketingContact) as never,
		defaultValues: { name: '', email: '', phone: '' },
	});

	function onSubmit(props: MarketingContactInput) {
		mutate(props, {
			onSuccess() {
				toast.success('CONTATO ADICIONADO COM SUCESSO!');

				reset();
				onOpenChange(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao adicionar contato');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar Contato</DialogTitle>
					<DialogDescription>
						Quem receberá os e-mails desta campanha
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<form onSubmit={handleSubmit(onSubmit)} className='grid gap-4'>
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
									placeholder='Nome ou razão social'
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
						name='phone'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='phone'>Celular (opcional):</FieldLabel>
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
						Adicionar <SaveIcon />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { DialogMarketingContact };
