'use client';

import { maskPhone } from '@segwise/core/masks';
import type { MarketingContact } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { endOfDay, format, parse, startOfDay } from 'date-fns';
import {
	FilterIcon,
	Loader2Icon,
	MailOpenIcon,
	MousePointerClickIcon,
	PlusIcon,
	PrinterIcon,
	SendIcon,
	Trash2Icon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
	MarketingContactFilters,
	MarketingContactFiltersCount,
} from '@/containers/marketing/contact-filters';
import {
	STATUS_BADGE,
	statusDateOf,
	statusOf,
} from '@/containers/marketing/contact-status';
import { MarketingSearch } from '@/containers/marketing/search';
import {
	useMarketingCampaignSend,
	useMarketingCampaigns,
	useMarketingContactRemove,
	useMarketingContactSend,
	useMarketingContacts,
	useMarketingContactsPrint,
} from '@/libraries/hooks/marketing/use-marketing';
import { useContactSearchParams } from '@/libraries/search-params/marketing';
import { cn } from '@/libraries/utils';

// from/to vêm como yyyy-MM-dd; "to" vale até o fim do dia.
function isWithinRange(
	date: string | null,
	from?: string | null,
	to?: string | null,
) {
	if (!from && !to) {
		return true;
	}

	if (!date) {
		return false;
	}

	const time = new Date(date).getTime();

	return (
		(!from ||
			time >= startOfDay(parse(from, 'yyyy-MM-dd', new Date())).getTime()) &&
		(!to || time <= endOfDay(parse(to, 'yyyy-MM-dd', new Date())).getTime())
	);
}

const RESEND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Espelha a regra do backend: sem reenvio dentro da janela de 7 dias.
function receivedRecently(contact: MarketingContact) {
	return (
		!!contact.lastSentAt &&
		contact.status !== 'failed' &&
		Date.now() - new Date(contact.lastSentAt).getTime() < RESEND_WINDOW_MS
	);
}

function formatDate(date: string | null) {
	return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '-';
}

function MarketingContactsPage() {
	const { id } = useParams<{ id: string }>();

	const { data: campaigns } = useMarketingCampaigns();
	const { data, isPending } = useMarketingContacts(id);
	const remove = useMarketingContactRemove(id);
	const sendOne = useMarketingContactSend(id);
	const sendAll = useMarketingCampaignSend(id);
	const print = useMarketingContactsPrint(id);

	const [confirmSendAll, setConfirmSendAll] = useState(false);
	const [adding, setAdding] = useState(false);
	const [removeId, setRemoveId] = useState<string | null>(null);

	const campaign = campaigns?.find((item) => item.id === id);

	const [searchParams, setSearchParams] = useContactSearchParams();

	// Quem clicou aparece primeiro, depois quem abriu: são os contatos para ligar.
	const allContacts = [...(data || [])].sort(
		(a, b) =>
			Number(!!b.clickedAt) - Number(!!a.clickedAt) ||
			Number(!!b.openedAt) - Number(!!a.openedAt) ||
			a.name.localeCompare(b.name),
	);

	const term = (searchParams.search || '').trim().toLowerCase();
	const termDigits = term.replace(/\D/g, '');

	const contacts = allContacts.filter(
		(contact) =>
			(!term ||
				contact.name.toLowerCase().includes(term) ||
				contact.email.toLowerCase().includes(term) ||
				contact.city?.toLowerCase().includes(term) ||
				contact.state?.toLowerCase() === term ||
				(!!termDigits && !!contact.phone?.includes(termDigits))) &&
			(!searchParams.state || contact.state === searchParams.state) &&
			(!searchParams.city ||
				contact.city?.toLowerCase() === searchParams.city.toLowerCase()) &&
			(!searchParams.status || statusOf(contact) === searchParams.status) &&
			isWithinRange(
				statusDateOf(contact, searchParams.status || 'all'),
				searchParams.from,
				searchParams.to,
			),
	);

	// Cidade/UF do contato cadastrado mais recentemente na campanha.
	const lastLocation =
		[...(data || [])]
			.filter((contact) => contact.city && contact.state)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
			.map((contact) => ({
				city: contact.city as string,
				state: contact.state as string,
			}))[0] ?? null;

	const pendingToSend = allContacts.filter(
		(contact) => !receivedRecently(contact),
	).length;

	const opened = allContacts.filter((item) => item.openedAt).length;
	const clicked = allContacts.filter((item) => item.clickedAt).length;

	return (
		<main className='grid grid-cols-1 gap-6 max-sm:gap-3 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center gap-x-3'>
					<div>
						<h1 className='text-lg font-semibold leading-none'>
							{campaign?.name ?? 'Campanha'}
						</h1>
						<p className='text-sm text-muted-foreground mt-1'>
							{allContacts.length} contatos · {opened} abriram · {clicked}{' '}
							clicaram
						</p>
					</div>
				</div>
				<div className='flex flex-row items-center gap-x-2'>
					<Button
						variant='outline'
						disabled={!contacts.length || print.isPending}
						onClick={() =>
							print.mutate(
								{
									ids: contacts.map((contact) => contact.id),
									filters: {
										state: searchParams.state,
										city: searchParams.city,
									},
								},
								{ onError: (error) => toast.error(error.message) },
							)
						}
					>
						<PrinterIcon /> Imprimir
					</Button>
					<Button
						variant='outline'
						disabled={!pendingToSend}
						onClick={() => setConfirmSendAll(true)}
					>
						<SendIcon /> Enviar ({pendingToSend})
					</Button>
					<Button onClick={() => setAdding(true)}>
						<PlusIcon /> Adicionar contato
					</Button>
				</div>
			</div>
			<div className='flex flex-row max-sm:flex-col max-sm:space-y-2 sm:items-center sm:justify-between'>
				<MarketingSearch
					className='max-sm:w-full'
					placeholder='Pesquisar nome, e-mail ou celular...'
					value={searchParams.search || ''}
					onChange={(search) => setSearchParams({ search })}
				/>
				<MarketingContactFilters contacts={allContacts}>
					<Button variant='outline' className='dark:bg-primary max-sm:flex-1'>
						<FilterIcon /> Filtrar <MarketingContactFiltersCount />
					</Button>
				</MarketingContactFilters>
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
											{allContacts.length
												? 'Nenhum contato encontrado com os filtros'
												: 'Nenhum contato na lista'}
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
										{contact.city && (
											<span className='block text-xs text-muted-foreground/70 truncate max-w-56'>
												{contact.city}
												{contact.state ? ` - ${contact.state}` : ''}
											</span>
										)}
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
												<span>
													<Button
														size='icon-sm'
														variant='outline'
														disabled={
															receivedRecently(contact) ||
															(sendOne.isPending &&
																sendOne.variables === contact.id)
														}
														onClick={() =>
															sendOne.mutate(contact.id, {
																onSuccess: () =>
																	toast.success('ENVIO ADICIONADO À FILA!'),
																onError: (error) => toast.error(error.message),
															})
														}
													>
														<SendIcon />
													</Button>
												</span>
											</TooltipTrigger>
											<TooltipContent>
												{receivedRecently(contact)
													? 'Já recebeu nos últimos 7 dias'
													: 'Enviar e-mail'}
											</TooltipContent>
										</Tooltip>
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
			{adding && (
				<DialogMarketingContact
					campaignId={id}
					campaignName={campaign?.name}
					lastLocation={lastLocation}
					open
					onOpenChange={(next) => !next && setAdding(false)}
				/>
			)}
			<Dialog open={print.isPending} onOpenChange={() => {}}>
				<DialogContent
					className='max-w-sm [&>button]:hidden'
					onEscapeKeyDown={(event) => event.preventDefault()}
					onInteractOutside={(event) => event.preventDefault()}
				>
					<div className='flex flex-col items-center gap-y-3 py-4 text-center'>
						<Loader2Icon className='size-8 animate-spin text-primary' />
						<div>
							<p className='font-semibold'>Gerando PDF</p>
							<p className='text-sm text-muted-foreground'>
								Isso pode levar alguns instantes...
							</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<DialogMarketingConfirm
				open={confirmSendAll}
				onOpenChange={setConfirmSendAll}
				title='Enviar E-mail'
				description={`O e-mail será enviado agora para ${pendingToSend} contato(s). Quem já recebeu nos últimos 7 dias não recebe de novo.`}
				isPending={sendAll.isPending}
				onConfirm={() =>
					sendAll.mutate(undefined, {
						onSuccess(response) {
							toast.success(response.message.toUpperCase());
							setConfirmSendAll(false);
						},
						onError: (error) => toast.error(error.message),
					})
				}
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
