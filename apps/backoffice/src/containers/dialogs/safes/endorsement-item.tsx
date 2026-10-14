'use client';

import { maskCPF, maskPlate, maskPostalCode } from '@segwise/core/masks';
import { translateSafeStatus } from '@segwise/core/translate';
import type { EndorsementSimple } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
	ArrowRightIcon,
	ClockIcon,
	Undo2Icon,
	XCircleIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { useEndorsementRevert } from '@/libraries/hooks/use-endorsement';

type Change = EndorsementSimple['revert']['changes'][number];

const FIELD_LABEL: Record<Change['field'], string> = {
	franchise: 'Frânquia',
	overnightPostalCode: 'CEP de pernoite',
	plate: 'Placa',
	driverCPF: 'CPF do condutor',
	driverName: 'Condutor',
	status: 'Status',
	canceledAt: 'Data do cancelamento',
};

const BLOCKED_REASON: Record<
	NonNullable<EndorsementSimple['revert']['reason']>,
	string
> = {
	reverted: '',
	expired: 'O prazo de 24 horas para reverter terminou.',
	not_latest: 'Só o endosso mais recente pode ser revertido.',
	no_snapshot:
		'Endosso anterior ao recurso de reversão: não há dados anteriores guardados.',
};

function formatValue(field: Change['field'], value: string | null) {
	if (value == null || value === '') {
		return '—';
	}

	switch (field) {
		case 'franchise':
			return new Intl.NumberFormat('pt-BR', {
				style: 'currency',
				currency: 'BRL',
			}).format(Number(value));
		case 'overnightPostalCode':
			return maskPostalCode(value);
		case 'plate':
			return maskPlate(value.toUpperCase());
		case 'driverCPF':
			return maskCPF(value);
		case 'driverName':
			return capitalizeFirstLetters(value);
		case 'status':
			return translateSafeStatus(value as never);
		case 'canceledAt':
			return format(toZonedTime(new Date(value), 'UTC'), 'dd/MM/yyyy');
		default:
			return value;
	}
}

const formatDateTime = (value: Date | string) =>
	format(new Date(value), "dd/MM/yyyy 'às' HH:mm");

function typeLabel(type: string) {
	return type === 'cancellation'
		? 'Cancelamento'
		: type === 'address'
			? 'Endereço'
			: type === 'franchise'
				? 'Frânquia'
				: 'Veicular | Condutor';
}

// Um endosso na lista da proposta: o que ele alterou, se já foi revertido e, quando
// ainda pode, o botão de reverter (com confirmação). As regras (24h, só o mais
// recente) vêm calculadas do servidor em `revert`.
function EndorsementListItem({
	safeId,
	endorsement,
}: {
	safeId: string;
	endorsement: EndorsementSimple;
}) {
	const { id, type, effectivedAt, createdAt, revertedAt } = endorsement;

	// Tolera uma resposta sem `revert` (painel novo antes do backend novo): sem
	// botão e sem lista de mudanças, em vez de quebrar.
	const revert: EndorsementSimple['revert'] = endorsement.revert ?? {
		canRevert: false,
		reason: null,
		until: createdAt,
		changes: [],
	};

	const [confirming, setConfirming] = useState<boolean>(false);

	const { mutate, isPending } = useEndorsementRevert(safeId);

	const reverted = !!revertedAt;

	function onConfirm() {
		toast.dismiss();

		mutate(id, {
			onSuccess() {
				toast.success('ENDOSSO REVERTIDO COM SUCESSO!');

				setConfirming(false);
			},
			onError(error) {
				toast.error(error.message.toUpperCase());

				setConfirming(false);
			},
		});
	}

	return (
		<div
			className={
				reverted
					? 'border border-border bg-muted/50 rounded-md p-4 space-y-2'
					: 'border border-border bg-muted rounded-md p-4 space-y-2'
			}
		>
			<div className='flex flex-row items-center justify-between gap-x-2'>
				<div className='text-sm'>
					<b>Endosso de {typeLabel(type)}</b>
				</div>
				{reverted && <Badge variant='destructive'>Revertido</Badge>}
			</div>
			<div className='text-sm'>
				<b>Data:</b>{' '}
				{format(toZonedTime(effectivedAt ?? createdAt, 'UTC'), 'dd/MM/yyyy')}
			</div>
			{revert.changes.length > 0 && (
				<ul className='space-y-0.5 text-xs text-muted-foreground'>
					{revert.changes.map((change) => (
						<li
							key={change.field}
							className={
								reverted
									? 'flex flex-row flex-wrap items-center gap-x-1.5 line-through'
									: 'flex flex-row flex-wrap items-center gap-x-1.5'
							}
						>
							<b className='text-foreground'>{FIELD_LABEL[change.field]}:</b>
							{formatValue(change.field, change.before)}
							<ArrowRightIcon className='size-3' />
							{formatValue(change.field, change.after)}
						</li>
					))}
				</ul>
			)}
			{reverted && (
				<div className='text-xs text-muted-foreground'>
					Revertido em {formatDateTime(revertedAt as Date)}
				</div>
			)}
			{!reverted && revert.canRevert && (
				<div className='flex flex-row items-center justify-between gap-x-2 pt-1'>
					<span className='flex flex-row items-center gap-x-1 text-xs text-muted-foreground'>
						<ClockIcon className='size-3' /> Pode ser revertido até{' '}
						{formatDateTime(revert.until)}
					</span>
					<Button
						type='button'
						size='sm'
						variant='outline'
						onClick={() => setConfirming(true)}
					>
						<Undo2Icon /> Reverter
					</Button>
				</div>
			)}
			{!reverted && !revert.canRevert && revert.reason && (
				<div className='text-xs text-muted-foreground'>
					{BLOCKED_REASON[revert.reason]}
				</div>
			)}
			<Dialog open={confirming} onOpenChange={setConfirming}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reverter endosso</DialogTitle>
						<DialogDescription>
							Endosso de {typeLabel(type)} · atenção ao realizar a ação
						</DialogDescription>
					</DialogHeader>
					<Separator />
					<div className='space-y-2 text-sm'>
						<p className='font-medium'>
							Os dados da proposta voltarão ao que eram antes do endosso:
						</p>
						{revert.changes.length > 0 ? (
							<ul className='space-y-1'>
								{revert.changes.map((change) => (
									<li
										key={change.field}
										className='flex flex-row flex-wrap items-center gap-x-1.5'
									>
										<b>{FIELD_LABEL[change.field]}:</b>
										{formatValue(change.field, change.after)}
										<ArrowRightIcon className='size-3' />
										<b>{formatValue(change.field, change.before)}</b>
									</li>
								))}
							</ul>
						) : (
							<p className='text-muted-foreground'>
								Nenhum dado exibível será alterado.
							</p>
						)}
						<p className='text-xs text-muted-foreground'>
							O endosso continuará na lista, marcado como revertido.
						</p>
					</div>
					<Separator />
					<DialogFooter>
						<DialogClose asChild>
							<Button variant='destructive' tabIndex={-1}>
								Fechar <XCircleIcon />
							</Button>
						</DialogClose>
						<Button
							isPending={isPending}
							textPending='Revertendo'
							onClick={onConfirm}
						>
							Reverter endosso <Undo2Icon />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export { EndorsementListItem };
