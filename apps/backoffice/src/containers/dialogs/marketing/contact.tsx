'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone } from '@segwise/core/masks';
import {
	BRAZILIAN_STATES,
	SchemaMarketingContact,
} from '@segwise/core/schemas';
import type { MarketingContactInput } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { SaveIcon, XCircleIcon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox';
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
import { useMarketingContactAdd } from '@/libraries/hooks/marketing/use-marketing';
import { useCities } from '@/libraries/hooks/use-cities';

function DialogMarketingContact({
	campaignId,
	campaignName,
	lastLocation,
	open,
	onOpenChange,
}: {
	campaignId: string;
	campaignName?: string;
	// Cidade/UF do último contato cadastrado na campanha: só isso persiste
	// entre aberturas; o resto do formulário começa sempre vazio.
	lastLocation?: { city: string; state: string } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { mutate, isPending } = useMarketingContactAdd(campaignId);

	const { control, handleSubmit, setValue, watch } = useForm<
		MarketingContactInput,
		unknown,
		MarketingContactInput
	>({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaMarketingContact) as never,
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			city: lastLocation?.city ?? '',
			state: (lastLocation?.state ?? '') as MarketingContactInput['state'],
		},
	});

	const state = watch('state');

	const {
		data: cities = [],
		isLoading: isLoadingCities,
		isError: citiesError,
	} = useCities(state);

	function onSubmit(props: MarketingContactInput) {
		mutate(props, {
			onSuccess() {
				toast.success('CONTATO ADICIONADO COM SUCESSO!');

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
				<div className='rounded-md border bg-muted/40 px-3 py-2 text-sm'>
					<span className='text-muted-foreground'>Campanha: </span>
					<span className='font-medium'>{campaignName ?? '-'}</span>
				</div>
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
					<Controller
						control={control}
						name='state'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='state'>Estado:</FieldLabel>
								<Select
									value={field.value || ''}
									onValueChange={(value) => {
										field.onChange(value);

										if (value !== field.value) {
											setValue('city', '', { shouldValidate: false });
										}
									}}
								>
									<SelectTrigger id='state' aria-invalid={fieldState.invalid}>
										<SelectValue placeholder='Selecionar o estado' />
									</SelectTrigger>
									<SelectContent>
										{BRAZILIAN_STATES.map((item) => (
											<SelectItem key={item.uf} value={item.uf}>
												{item.uf} - {item.name}
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
						name='city'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='city'>Cidade:</FieldLabel>
								{citiesError ? (
									<Input
										{...field}
										id='city'
										aria-invalid={fieldState.invalid}
										placeholder='Não foi possível carregar, digite a cidade'
										onChange={({ target: { value } }) =>
											field.onChange(capitalizeFirstLetters(value))
										}
									/>
								) : (
									<Combobox
										value={
											field.value
												? { value: field.value, label: field.value }
												: null
										}
										items={cities.map((city) => ({ value: city, label: city }))}
										disabled={!state}
										onValueChange={(item) => field.onChange(item?.value ?? '')}
									>
										<ComboboxInput
											id='city'
											aria-invalid={fieldState.invalid}
											placeholder={
												!state
													? 'Escolha o estado primeiro'
													: isLoadingCities
														? 'Carregando cidades...'
														: 'Pesquisar cidade'
											}
										/>
										<ComboboxContent>
											<ComboboxEmpty>Nenhuma cidade encontrada!</ComboboxEmpty>
											<ComboboxList>
												{(item: { value: string; label: string }) => (
													<ComboboxItem key={item.value} value={item}>
														{item.label}
													</ComboboxItem>
												)}
											</ComboboxList>
										</ComboboxContent>
									</Combobox>
								)}
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
