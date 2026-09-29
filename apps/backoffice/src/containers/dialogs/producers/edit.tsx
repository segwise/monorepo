'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone } from '@segwise/core/masks';
import {
	SchemaProducerAreaOfActivity,
	SchemaProducerPartnerUpdate,
	SchemaProducerTypeOfPayment,
} from '@segwise/core/schemas';
import {
	translateProducerType,
	translateProducerTypeOfPayment,
} from '@segwise/core/translate';
import type {
	ProducerPartnerUpdate,
	ProducerSimple,
} from '@segwise/core/types';
import { capitalizeFirstLetters, generateReferral } from '@segwise/core/utils';
import { SaveIcon, XCircleIcon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
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
import { Field, FieldError, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ProducerPaymentDays } from '@/containers/forms/producers/payment-days';
import { useProducersUpdate } from '@/libraries/hooks/producers/use-producers-update';

function DialogProducerPartnerEdit({
	producer,
	open,
	onOpenChange,
}: {
	producer: ProducerSimple;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate, isPending } = useProducersUpdate(producer.id);

	const { control, watch, handleSubmit } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerPartnerUpdate),
		defaultValues: {
			name: capitalizeFirstLetters(producer.name),
			phone: producer.contact.phone ? maskPhone(producer.contact.phone) : '',
			type: producer.typeOfProduction as z.infer<
				typeof SchemaProducerAreaOfActivity
			>,
			referral: producer.referral,
			percentage: producer.percentageOfProduction,
			typeOfPayment: producer.typeOfProductionPayment,
			startOfPayment: producer.startOfProductionPayment,
			pix: producer.pix || '',
		},
	});

	function onSubmit(props: ProducerPartnerUpdate) {
		mutate(props, {
			onSuccess(_data, _variables, _mutate, ctx) {
				toast.success('PARCEIRO ATUALIZADO COM SUCESSO!');

				onOpenChange(false);

				ctx.client.invalidateQueries({ queryKey: ['producers', 'simple'] });
				ctx.client.invalidateQueries({
					queryKey: ['producers', 'simple', 'full'],
				});
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
					<DialogTitle>Editar Parceiro</DialogTitle>
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
										<SelectItem
											value={SchemaProducerTypeOfPayment.enum.monthly}
										>
											{capitalizeFirstLetters(
												translateProducerTypeOfPayment(
													SchemaProducerTypeOfPayment.enum.monthly,
												),
											)}
										</SelectItem>
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
									{watch('typeOfPayment') === 'bi_weekly'
										? 'Dias de Pagamento:'
										: 'Dia de Pagamento:'}
								</FieldLabel>
								<ProducerPaymentDays
									id='startOfPayment'
									typeOfPayment={watch('typeOfPayment')}
									value={field.value}
									onChange={field.onChange}
									invalid={fieldState.invalid}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='type'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid} className='col-span-1'>
								<FieldLabel htmlFor='type'>Área de Atuação:</FieldLabel>
								<Select
									{...field}
									value={field.value || ''}
									onValueChange={field.onChange}
								>
									<SelectTrigger id='type' aria-invalid={fieldState.invalid}>
										<SelectValue placeholder='Selecionar' />
									</SelectTrigger>
									<SelectContent className='max-h-70'>
										{SchemaProducerAreaOfActivity.options
											.slice()
											.sort((a, b) =>
												translateProducerType(a).localeCompare(
													translateProducerType(b),
												),
											)
											.map((item) => (
												<SelectItem key={item} value={item}>
													{capitalizeFirstLetters(translateProducerType(item))}
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
						name='referral'
						render={({ field, fieldState }) => (
							<Field
								data-invalid={fieldState.invalid}
								className='col-span-full'
							>
								<FieldSet className='flex flex-row items-center justify-between'>
									<FieldLabel htmlFor='referral'>
										Código de Indicação:
									</FieldLabel>
									<Button
										type='button'
										variant='link'
										size='sm'
										className='text-xs'
										onClick={() => field.onChange(generateReferral())}
									>
										Gerar Código Aleatório
									</Button>
								</FieldSet>
								<Input
									{...field}
									id='referral'
									aria-invalid={fieldState.invalid}
									placeholder='Informar Código'
									className='uppercase'
									onChange={({ target: { value } }) =>
										field.onChange(value.trim())
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
						name='pix'
						render={({ field, fieldState }) => (
							<Field
								data-invalid={fieldState.invalid}
								className='col-span-full'
							>
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

export { DialogProducerPartnerEdit };
