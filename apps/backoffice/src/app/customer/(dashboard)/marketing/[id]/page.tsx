'use client';

import { maskPhone } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { format } from 'date-fns';
import {
	ArrowLeftIcon,
	MailOpenIcon,
	MousePointerClickIcon,
	PlusIcon,
	Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';
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

const STATUS_LABEL = {
	never: 'Não enviado',
	sent: 'Enviado',
	delivered: 'Entregue',
	bounced: 'Não entregue',
	complained: 'Marcou spam',
	failed: 'Falhou',
} as const;

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
					<Button size='icon-sm' variant='outline' asChild>
						<Link href='/marketing'>
							<ArrowLeftIcon />
						</Link>
					</Button>
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
								<TableHead className='text-right w-30'>Ações</TableHead>
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
											variant={
												contact.clickedAt
													? 'success'
													: contact.openedAt
														? 'active'
														: 'default'
											}
											className='px-2'
										>
											{contact.clickedAt
												? 'Clicou'
												: contact.openedAt
													? 'Abriu'
													: STATUS_LABEL[contact.status]}
										</Badge>
									</TableCell>
									<TableCell className='justify-end flex flex-row gap-x-2 w-30'>
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
