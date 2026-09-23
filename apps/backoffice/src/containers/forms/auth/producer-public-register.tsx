'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskCNPJ, maskCPF, maskNumber, maskPhone } from '@segwise/core/masks';
import { SchemaProducerPublicRegister } from '@segwise/core/schemas';
import type { ProducerPublicRegister } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isCPF } from '@segwise/core/valids';
import { SendIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useProducersPublicRegister } from '@/libraries/hooks/producers/use-producers-public-register';

function FormProducerPublicRegister({ slug }: { slug: string }) {
	const router = useRouter();

	const { mutate, isPending } = useProducersPublicRegister(slug);

	const { control, handleSubmit } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaProducerPublicRegister),
		defaultValues: {
			cpfOrCnpj: '',
			name: '',
			phone: '',
			email: '',
			pix: '',
		},
	});

	function onSubmit(props: ProducerPublicRegister) {
		mutate(props, {
			onSuccess() {
				router.push(
					`/register/sucesso?email=${encodeURIComponent(props.email)}`,
				);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao concluir cadastro');
			},
		});
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='grid grid-cols-1 sm:grid-cols-2 gap-4'
		>
			<Controller
				control={control}
				name='cpfOrCnpj'
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid} className='col-span-full'>
						<FieldLabel htmlFor='cpfOrCnpj'>CPF ou CNPJ:</FieldLabel>
						<Input
							{...field}
							id='cpfOrCnpj'
							aria-invalid={fieldState.invalid}
							placeholder='Informar Documento'
							onChange={({ target: { value } }) => {
								field.onChange(
									value.length >= 11
										? isCPF(value)
											? maskCPF(value)
											: maskCNPJ(value)
										: maskNumber(value),
								);
							}}
							maxLength={18}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				control={control}
				name='name'
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid} className='col-span-full'>
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
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				control={control}
				name='email'
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid} className='col-span-1'>
						<FieldLabel htmlFor='email'>E-mail:</FieldLabel>
						<Input
							{...field}
							id='email'
							aria-invalid={fieldState.invalid}
							placeholder='exemplo@hospedagem.com'
							className='lowercase'
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				control={control}
				name='pix'
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid} className='col-span-full'>
						<FieldLabel htmlFor='pix'>Chave PIX:</FieldLabel>
						<Input
							{...field}
							id='pix'
							aria-invalid={fieldState.invalid}
							placeholder='Informar chave PIX para recebimento'
							onChange={({ target: { value } }) => field.onChange(value.trim())}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<FieldGroup className='col-span-full'>
				<Button
					className='w-full'
					type='submit'
					isPending={isPending}
					textPending='Enviando'
				>
					Concluir cadastro <SendIcon />
				</Button>
			</FieldGroup>
		</form>
	);
}

export { FormProducerPublicRegister };
