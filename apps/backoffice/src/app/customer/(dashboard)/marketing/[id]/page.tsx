'use client';

import { maskPhone } from '@segwise/core/masks';
import type { MarketingContact } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import {
	MailOpenIcon,
	MousePointerClickIcon,
	PlusIcon,
	Trash2Icon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { DialogMarketingConfirm } from '@/containers/dialogs/marketing/confirm';
import { DialogMarketingContact } from '@/containers/dialogs/marketing/contact';
import {
	useMarketingCampaigns,
	useMarketingContactRemove,
	useMarketingContacts,
} from '@/libraries/hooks/marketing/use-marketing';
import { cn } from '@/libraries/utils';

const STATUS_BADGE = {
	never: {
		label: 'Não enviado',
		className: 'bg-transparent text-muted-foreground',
	},
	sent: { label: 'Enviado', className: 'border-0 bg-slate-500 text-white' },
	delivered: {
		label: 'Entregue',
		className: 'border-0 bg-green-500 text-white',
	},
	opened: { label: 'Aberto', className: 'border-0 bg-blue-500 text-white' },
	clicked: { label: 'Clicado', className: 'border-0 bg-purple-500 text-white' },
	bounced: {
		label: 'Não entregue',
		className: 'border-0 bg-red-500 text-white',
	},
	complained: { label: 'Spam', className: 'border-0 bg-orange-500 text-white' },
	failed: { label: 'Falhou', className: 'border-0 bg-red-700 text-white' },
} as const;

function statusOf(contact: MarketingContact): keyof typeof STATUS_BADGE {
	if (contact.status === 'bounced' || contact.status === 'complained') {
		return contact.status;
	}

	if (contact.clickedAt) {
		return 'clicked';
	}

	if (contact.openedAt) {
		return 'opened';
	}

	return contact.status;
}

function formatDate(date: string | null) {
	return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '-';
}

function MarketingContactsPage() {
	const { id } = useParams<{ id: string }>();

	const { data: campaigns } = useMarketingCampaigns();
	const { data, isPending } = useMarketingContacts(id);
	const remove = useMarketingContactRemove(id);

	const [adding, setAdding] = useState(false);
	const [removeId, setRemoveId] = useState<string | null>(null);

	const campaign = campaigns?.find((item) => item.id === id);

	// Quem clicou aparece primeiro, depois quem abriu: são os contatos para ligar.
	const contacts = [...(data || [])].sort(
		(a, b) =>
			Number(!!b.clickedAt) - Number(!!a.clickedAt) ||
			Number(!!b.openedAt) - Number(!!a.openedAt) ||
			a.name.localeCompare(b.name),
	);

	const opened = contacts.filter((item) => item.openedAt).length;
	const clicked = contacts.filter((item) => item.clickedAt).length;

	return (
		<main className='grid grid-cols-1 gap-6 max-sm:gap-3 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center gap-x-3'>
					<div>
						<h1 className='text-lg font-semibold leading-none'>
							{campaign?.name ?? 'Campanha'}
						</h1>
						<p className='text-sm text-muted-foreground mt-1'>
							{contacts.length} contatos · {opened} abriram · {clicked} clicaram
						</p>
					</div>
				</div>
				<Button onClick={() => setAdding(true)}>
					<PlusIcon /> Adicionar contato
				</Button>
			</div>
			<Card className='p-0 overflow-hidden'>
				<CardContent className='p-0'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='text-left w-60'>Contato</TableHead>
								<TableHead className='text-left w-60'>Telefone</TableHead>
								<TableHead className='text-left flex-1' />
								<TableHead className='text-center w-40'>Último envio</TableHead>
								<TableHead className='text-center w-40'>Abriu</TableHead>
								<TableHead className='text-center w-40'>Clicou</TableHead>
								<TableHead className='text-center w-32'>Status</TableHead>
								<TableHead className='text-right'>Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isPending &&
								Array.from({ length: 6 }).map((_, index) => (
									<TableRow
										key={index.toString()}
										className='hover:bg-transparent'
									>
										<TableCell colSpan={100}>
											<Skeleton className='w-full h-8' />
										</TableCell>
									</TableRow>
								))}
							{!isPending && contacts.length === 0 && (
								<TableRow className='hover:bg-transparent'>
									<TableCell colSpan={100} className='text-center py-10'>
										<span className='text-sm text-muted-foreground'>
											Nenhum contato na lista
										</span>
									</TableCell>
								</TableRow>
							)}
							{contacts.map((contact) => (
								<TableRow key={contact.id}>
									<TableCell className='text-left w-60'>
										<span className='block text-sm font-medium truncate max-w-56'>
											{capitalizeFirstLetters(contact.name)}
										</span>
										<span className='block text-xs text-muted-foreground truncate max-w-56'>
											{contact.email}
										</span>
									</TableCell>
									<TableCell className='text-left w-60 text-xs font-medium'>
										{contact.phone ? maskPhone(contact.phone) : '-'}
									</TableCell>
									<TableCell className='flex-1' />
									<TableCell className='w-40 text-center text-xs font-medium'>
										{formatDate(contact.lastSentAt)}
									</TableCell>
									<TableCell className='w-40 text-center text-xs font-medium'>
										{contact.openedAt ? (
											<span className='inline-flex items-center gap-x-1'>
												<MailOpenIcon className='size-3.5' />
												{formatDate(contact.openedAt)}
											</span>
										) : (
											'-'
										)}
									</TableCell>
									<TableCell className='w-40 text-center text-xs font-medium'>
										{contact.clickedAt ? (
											<span className='inline-flex items-center gap-x-1'>
												<MousePointerClickIcon className='size-3.5' />
												{formatDate(contact.clickedAt)}
											</span>
										) : (
											'-'
										)}
									</TableCell>
									<TableCell className='w-32 text-center'>
										<Badge
											className={cn(
												'px-2',
												STATUS_BADGE[statusOf(contact)].className,
											)}
										>
											{STATUS_BADGE[statusOf(contact)].label}
										</Badge>
									</TableCell>
									<TableCell className='justify-end flex flex-row gap-x-2'>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													size='icon-sm'
													variant='destructive'
													onClick={() => setRemoveId(contact.id)}
												>
													<Trash2Icon />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Remover da lista</TooltipContent>
										</Tooltip>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
			<DialogMarketingContact
				campaignId={id}
				open={adding}
				onOpenChange={setAdding}
			/>
			<DialogMarketingConfirm
				open={!!removeId}
				onOpenChange={(open) => !open && setRemoveId(null)}
				title='Remover Contato'
				description='O contato deixa de receber os e-mails desta campanha e o histórico de envios dele é apagado.'
				isPending={remove.isPending}
				onConfirm={() =>
					removeId &&
					remove.mutate(removeId, {
						onSuccess() {
							toast.success('CONTATO REMOVIDO COM SUCESSO!');
							setRemoveId(null);
						},
						onError: (error) => toast.error(error.message),
					})
				}
			/>
		</main>
	);
}

export default MarketingContactsPage;
