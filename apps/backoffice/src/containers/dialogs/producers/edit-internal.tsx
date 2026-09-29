'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone } from '@segwise/core/masks';
import {
	SchemaProducerInternalUpdate,
	SchemaProducerStartOfProductionPayment,
	SchemaProducerTypeOfPayment,
} from '@segwise/core/schemas';
import { translateProducerTypeOfPayment } from '@segwise/core/translate';
import type {
	ProducerInternalUpdate,
	ProducerSimple,
} from '@segwise/core/types';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useProducersUpdateInternal } from '@/libraries/hooks/producers/use-producers-update-internal';

// Só mensal e quinzenal fazem sentido pra produtor interno (semanal não é
// usado hoje).
const TYPE_OF_PAYMENT_OPTIONS = [
	SchemaProducerTypeOfPayment.enum.monthly,
	SchemaProducerTypeOfPayment.enum.bi_weekly,
];

function DialogProducerInternalEdit({
	producer,
	open,
	onOpenChange,
}: {
	producer: ProducerSimple;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate, isPending } = useProducersUpdateInternal(producer.id);

	const { control, handleSubmit } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerInternalUpdate),
		defaultValues: {
			name: producer.name,
			phone: producer.contact.phone || '',
			percentage: producer.percentageOfProduction,
			typeOfPayment: producer.typeOfProductionPayment,
			startOfPayment: producer.startOfProductionPayment,
			pix: producer.pix || '',
		},
	});

	function onSubmit(props: ProducerInternalUpdate) {
		mutate(props, {
			async onSuccess(_data, _variables, _mutate, ctx) {
				toast.success('PRODUTOR ATUALIZADO COM SUCESSO!');

				await Promise.all([
					ctx.client.invalidateQueries({ queryKey: ['producers', 'simple'] }),
					ctx.client.invalidateQueries({
						queryKey: ['producers', 'simple', 'full'],
					}),
				]);

				onOpenChange(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao atualizar registro');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-3xl'>
				<DialogHeader>
					<DialogTitle>Editar Produtor</DialogTitle>
					<DialogDescription>Atenção ao realizar a ação</DialogDescription>
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
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='name'>Nome:</FieldLabel>
								<Input
									{...field}
									id='name'
									aria-invalid={fieldState.invalid}
									placeholder='Nome'
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
						name='phone'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
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
					<Controller
						control={control}
						name='typeOfPayment'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='typeOfPayment'>
									Tipo de Pagamento:
								</FieldLabel>
								<Select
									{...field}
									value={field.value || ''}
									onValueChange={field.onChange}
								>
									<SelectTrigger
										id='typeOfPayment'
										aria-invalid={fieldState.invalid}
									>
										<SelectValue placeholder='Selecionar' />
									</SelectTrigger>
									<SelectContent>
										{TYPE_OF_PAYMENT_OPTIONS.map((item) => (
											<SelectItem key={item} value={item}>
												{capitalizeFirstLetters(
													translateProducerTypeOfPayment(item),
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='percentage'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='percentage'>Comissão:</FieldLabel>
								<Input
									{...field}
									id='percentage'
									value={field.value ? String(field.value) : ''}
									aria-invalid={fieldState.invalid}
									type='number'
									placeholder='% 0'
									min={1}
									max={100}
									maxLength={3}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='startOfPayment'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='startOfPayment'>
									Dia de Pagamento:
								</FieldLabel>
								<Select
									{...field}
									value={field.value ? String(field.value) : ''}
									onValueChange={(value) => field.onChange(Number(value))}
								>
									<SelectTrigger
										id='startOfPayment'
										aria-invalid={fieldState.invalid}
									>
										<SelectValue placeholder='Selecionar' />
									</SelectTrigger>
									<SelectContent>
										{SchemaProducerStartOfProductionPayment.values
											.values()
											.toArray()
											.map((item) => (
												<SelectItem key={item} value={String(item)}>
													Dia {item}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='pix'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='pix'>Chave PIX:</FieldLabel>
								<Input
									{...field}
									id='pix'
									value={field.value || ''}
									aria-invalid={fieldState.invalid}
									placeholder='Informar Chave PIX'
									className='uppercase'
									onChange={({ target: { value } }) =>
										field.onChange(!value ? '' : value.trim())
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

export { DialogProducerInternalEdit };
