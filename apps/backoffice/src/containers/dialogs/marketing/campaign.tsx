'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { maskPhone } from '@segwise/core/masks';
import { SchemaMarketingCampaign } from '@segwise/core/schemas';
import type {
	MarketingCampaign,
	MarketingCampaignInput,
} from '@segwise/core/types';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
	useMarketingCampaignSave,
	useMarketingTemplates,
} from '@/libraries/hooks/marketing/use-marketing';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

function DialogMarketingCampaign({
	campaign,
	open,
	onOpenChange,
}: {
	campaign?: MarketingCampaign | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { data: templates = [] } = useMarketingTemplates();
	const { mutate, isPending } = useMarketingCampaignSave(campaign?.id);

	const { control, handleSubmit, watch, setValue } = useForm<
		MarketingCampaignInput,
		unknown,
		MarketingCampaignInput
	>({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaMarketingCampaign) as never,
		defaultValues: {
			name: campaign?.name ?? '',
			template: campaign?.template,
			subject: campaign?.subject ?? '',
			whatsappPhone: campaign?.whatsappPhone
				? maskPhone(campaign.whatsappPhone)
				: '',
			whatsappMessage: campaign?.whatsappMessage ?? '',
			frequency: campaign?.frequency ?? 'monthly',
			dayOfMonth: campaign?.dayOfMonth ?? 1,
			hour: campaign?.hour ?? 9,
			active: campaign?.active ?? false,
		},
	});

	function onSubmit(props: MarketingCampaignInput) {
		mutate(props, {
			onSuccess() {
				toast.success(
					campaign ? 'CAMPANHA ATUALIZADA COM SUCESSO!' : 'CAMPANHA CRIADA!',
				);

				onOpenChange(false);
			},
			onError(error) {
				toast.error(error.message || 'Falha ao salvar campanha');
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-3xl'>
				<DialogHeader>
					<DialogTitle>
						{campaign ? 'Editar Campanha' : 'Nova Campanha'}
					</DialogTitle>
					<DialogDescription>
						Envio automático de e-mail para a lista de contatos
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
									placeholder='Ex.: Contabilidades - Mensal'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='template'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='template'>Modelo do E-mail:</FieldLabel>
								<Select
									value={field.value || ''}
									onValueChange={(value) => {
										field.onChange(value);

										const template = templates.find(
											(item) => item.value === value,
										);

										if (template && !watch('subject')) {
											setValue('subject', template.defaultSubject, {
												shouldValidate: true,
											});
										}
									}}
								>
									<SelectTrigger
										id='template'
										aria-invalid={fieldState.invalid}
									>
										<SelectValue placeholder='Selecionar' />
									</SelectTrigger>
									<SelectContent>
										{templates.map((item) => (
											<SelectItem key={item.value} value={item.value}>
												{item.label}
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
						name='subject'
						render={({ field, fieldState }) => (
							<Field
								data-invalid={fieldState.invalid}
								className='sm:col-span-2'
							>
								<FieldLabel htmlFor='subject'>Assunto:</FieldLabel>
								<Input
									{...field}
									id='subject'
									aria-invalid={fieldState.invalid}
									placeholder='Assunto do e-mail'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='whatsappPhone'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='whatsappPhone'>
									WhatsApp do botão:
								</FieldLabel>
								<Input
									{...field}
									id='whatsappPhone'
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
						name='whatsappMessage'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='whatsappMessage'>
									Mensagem inicial (opcional):
								</FieldLabel>
								<Textarea
									{...field}
									value={field.value || ''}
									id='whatsappMessage'
									rows={2}
									placeholder='Olá, vi o e-mail de parceria...'
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						control={control}
						name='frequency'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='frequency'>Frequência:</FieldLabel>
								<Select
									value={field.value}
									onValueChange={(value) => field.onChange(value)}
								>
									<SelectTrigger id='frequency'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='daily'>Todo dia</SelectItem>
										<SelectItem value='monthly'>Todo mês</SelectItem>
									</SelectContent>
								</Select>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					{watch('frequency') === 'monthly' && (
						<Controller
							control={control}
							name='dayOfMonth'
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor='dayOfMonth'>Dia do envio:</FieldLabel>
									<Select
										value={field.value ? String(field.value) : ''}
										onValueChange={(value) => field.onChange(Number(value))}
									>
										<SelectTrigger id='dayOfMonth'>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent>
											{DAYS.map((day) => (
												<SelectItem key={day} value={String(day)}>
													Dia {day}
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
					)}
					<Controller
						control={control}
						name='hour'
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor='hour'>Horário (Brasília):</FieldLabel>
								<Select
									value={String(field.value)}
									onValueChange={(value) => field.onChange(Number(value))}
								>
									<SelectTrigger id='hour'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{HOURS.map((hour) => (
											<SelectItem key={hour} value={String(hour)}>
												{String(hour).padStart(2, '0')}:00
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
						name='active'
						render={({ field }) => (
							<Field orientation='horizontal' className='sm:col-span-2'>
								<Switch
									id='active'
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
								<FieldLabel htmlFor='active'>
									Campanha ativa (envia automaticamente na data agendada)
								</FieldLabel>
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

export { DialogMarketingCampaign };
