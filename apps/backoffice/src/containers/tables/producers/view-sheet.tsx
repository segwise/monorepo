'use client';

import {
	translateProducerType,
	translateProducerTypeOfPayment,
} from '@segwise/core';
import { maskCNPJ, maskCPF, maskPhone } from '@segwise/core/masks';
import type { ProducerSimple } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import { PencilIcon, XCircleIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { placeholder } from '@/config/placeholder';

function FieldView({ label, value }: { label: string; value?: string | null }) {
	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<span className='text-sm font-medium text-muted-foreground'>
				{value || '—'}
			</span>
		</Field>
	);
}

function SheetProducerView({
	producer,
	open,
	onOpenChange,
	onEdit,
}: {
	producer: ProducerSimple | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEdit: () => void;
}) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>
						{producer?.typeOfProduction
							? 'Detalhes do Parceiro'
							: 'Detalhes do Produtor'}
					</SheetTitle>
					<SheetDescription>
						{producer?.typeOfProduction
							? 'Contato, área de atuação e comissão'
							: 'Contato e comissão'}
					</SheetDescription>
				</SheetHeader>
				<Separator />
				{!!producer && (
					<div className='px-4 space-y-4 overflow-auto'>
						<div className='flex flex-row items-center justify-start gap-x-3'>
							<Avatar className='size-12 border bg-background'>
								<AvatarImage
									src={producer.avatar || placeholder.user}
									width={52}
									height={52}
									alt={producer.name}
								/>
								<AvatarFallback>
									{producer.name.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div>
								<span className='block text-sm font-semibold'>
									{capitalizeFirstLetters(producer.name)}
								</span>
								<Badge className='mt-1'>
									{producer.typeOfProduction
										? capitalizeFirstLetters(
												translateProducerType(producer.typeOfProduction) ?? '',
											)
										: 'Produtor'}
								</Badge>
							</div>
						</div>
						<Separator />
						<div className='grid grid-cols-2 gap-3'>
							<FieldView
								label='CPF/CNPJ'
								value={
									producer.cnpj
										? maskCNPJ(producer.cnpj)
										: producer.cpf
											? maskCPF(producer.cpf)
											: null
								}
							/>
							<FieldView
								label='Celular'
								value={
									producer.contact.phone
										? maskPhone(producer.contact.phone)
										: null
								}
							/>
							<FieldView label='E-mail' value={producer.contact.email} />
							<FieldView label='Chave PIX' value={producer.pix} />
							{!!producer.typeOfProduction && (
								<FieldView
									label='Código de Indicação'
									value={producer.referral?.toUpperCase()}
								/>
							)}
							<FieldView
								label='Comissão'
								value={`${producer.percentageOfProduction}%`}
							/>
							<FieldView
								label='Tipo de Pagamento'
								value={capitalizeFirstLetters(
									translateProducerTypeOfPayment(
										producer.typeOfProductionPayment,
									),
								)}
							/>
							<FieldView
								label={
									producer.startOfProductionPayment.length > 1
										? 'Dias de Pagamento'
										: 'Dia de Pagamento'
								}
								value={producer.startOfProductionPayment
									.map((day) => `Dia ${day}`)
									.join(' e ')}
							/>
							<FieldView
								label='Membro desde'
								value={format(new Date(producer.memberSince), 'dd/MM/yyyy')}
							/>
						</div>
					</div>
				)}
				<Separator />
				<SheetFooter>
					<Button onClick={onEdit}>
						Editar <PencilIcon />
					</Button>
					<SheetClose asChild>
						<Button variant='destructive'>
							Fechar <XCircleIcon />
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

export { SheetProducerView };
