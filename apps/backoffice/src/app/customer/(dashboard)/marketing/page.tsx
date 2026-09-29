'use client';

import type { MarketingCampaign } from '@segwise/core/types';
import { format } from 'date-fns';
import {
	PencilIcon,
	PlusIcon,
	SendIcon,
	Trash2Icon,
	UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
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
import { DialogMarketingCampaign } from '@/containers/dialogs/marketing/campaign';
import { DialogMarketingConfirm } from '@/containers/dialogs/marketing/confirm';
import {
	useMarketingCampaignDelete,
	useMarketingCampaignSend,
	useMarketingCampaigns,
	useMarketingTemplates,
} from '@/libraries/hooks/marketing/use-marketing';

function describeSchedule(campaign: MarketingCampaign) {
	const hour = `${String(campaign.hour).padStart(2, '0')}:00`;

	return campaign.frequency === 'daily'
		? `Todo dia às ${hour}`
		: `Todo dia ${campaign.dayOfMonth} às ${hour}`;
}

function CampaignActions({
	campaign,
	onEdit,
}: {
	campaign: MarketingCampaign;
	onEdit: () => void;
}) {
	const [confirm, setConfirm] = useState<'send' | 'delete' | null>(null);

	const send = useMarketingCampaignSend(campaign.id);
	const remove = useMarketingCampaignDelete(campaign.id);

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button size='icon-sm' variant='outline' asChild>
						<Link href={`/marketing/${campaign.id}`}>
							<UsersIcon />
						</Link>
					</Button>
				</TooltipTrigger>
				<TooltipContent>Contatos</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size='icon-sm'
						variant='outline'
						onClick={() => setConfirm('send')}
					>
						<SendIcon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Enviar agora</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button size='icon-sm' variant='outline' onClick={onEdit}>
						<PencilIcon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Editar</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size='icon-sm'
						variant='destructive'
						onClick={() => setConfirm('delete')}
					>
						<Trash2Icon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Excluir</TooltipContent>
			</Tooltip>
			<DialogMarketingConfirm
				open={confirm === 'send'}
				onOpenChange={(open) => !open && setConfirm(null)}
				title='Enviar Agora'
				description={`O e-mail será enviado imediatamente para os ${campaign.contactsCount} contatos da campanha, além do agendamento normal.`}
				isPending={send.isPending}
				onConfirm={() =>
					send.mutate(undefined, {
						onSuccess() {
							toast.success('ENVIO ADICIONADO À FILA!');
							setConfirm(null);
						},
						onError: (error) => toast.error(error.message),
					})
				}
			/>
			<DialogMarketingConfirm
				open={confirm === 'delete'}
				onOpenChange={(open) => !open && setConfirm(null)}
				title='Excluir Campanha'
				description='A campanha, a lista de contatos e o histórico de envios serão excluídos definitivamente.'
				isPending={remove.isPending}
				onConfirm={() =>
					remove.mutate(undefined, {
						onSuccess() {
							toast.success('CAMPANHA EXCLUÍDA COM SUCESSO!');
							setConfirm(null);
						},
						onError: (error) => toast.error(error.message),
					})
				}
			/>
		</>
	);
}

function MarketingPage() {
	const { data, isPending } = useMarketingCampaigns();
	const { data: templates = [] } = useMarketingTemplates();

	const [dialog, setDialog] = useState<{
		open: boolean;
		campaign: MarketingCampaign | null;
	}>({ open: false, campaign: null });

	const campaigns = data || [];

	return (
		<main className='grid grid-cols-1 gap-6 max-sm:gap-3 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div>
					<h1 className='text-lg font-semibold leading-none'>Campanhas</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						E-mails automáticos para parceiros, com acompanhamento de abertura e
						clique
					</p>
				</div>
				<div className='flex flex-row items-center gap-x-2'>
					<Button onClick={() => setDialog({ open: true, campaign: null })}>
						<PlusIcon /> Nova campanha
					</Button>
				</div>
			</div>
			<Card className='p-0 overflow-hidden'>
				<CardContent className='p-0'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='text-left flex-1'>Campanha</TableHead>
								<TableHead className='text-left w-56 max-md:hidden'>
									Agendamento
								</TableHead>
								<TableHead className='text-center w-24 max-sm:hidden'>
									Contatos
								</TableHead>
								<TableHead className='text-center w-28'>Status</TableHead>
								<TableHead className='text-right'>Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isPending &&
								Array.from({ length: 4 }).map((_, index) => (
									<TableRow
										key={index.toString()}
										className='hover:bg-transparent'
									>
										<TableCell colSpan={100}>
											<Skeleton className='w-full h-8' />
										</TableCell>
									</TableRow>
								))}
							{!isPending && campaigns.length === 0 && (
								<TableRow className='hover:bg-transparent'>
									<TableCell colSpan={100} className='text-center py-10'>
										<span className='text-sm text-muted-foreground'>
											Nenhuma campanha criada ainda
										</span>
									</TableCell>
								</TableRow>
							)}
							{campaigns.map((campaign) => (
								<TableRow key={campaign.id}>
									<TableCell className='text-left flex-1 min-w-0'>
										<span className='block text-sm font-medium truncate'>
											{campaign.name}
										</span>
										<span className='block text-xs text-muted-foreground font-normal leading-none truncate mt-0.5'>
											{templates.find(
												(item) => item.value === campaign.template,
											)?.label ?? campaign.template}
										</span>
									</TableCell>
									<TableCell className='text-left w-56 max-md:hidden'>
										<span className='block text-xs font-medium'>
											{describeSchedule(campaign)}
										</span>
										<span className='block text-xs text-muted-foreground font-normal leading-none mt-0.5'>
											{campaign.lastRunAt
												? `Último envio ${format(new Date(campaign.lastRunAt), 'dd/MM/yyyy HH:mm')}`
												: 'Nunca enviada'}
										</span>
									</TableCell>
									<TableCell className='w-24 text-center text-xs font-medium max-sm:hidden'>
										{campaign.contactsCount}
									</TableCell>
									<TableCell className='w-28 text-center'>
										<Badge
											variant={campaign.active ? 'success' : 'default'}
											className='px-2'
										>
											{campaign.active ? 'Ativa' : 'Pausada'}
										</Badge>
									</TableCell>
									<TableCell className='justify-end flex flex-row gap-x-2'>
										<CampaignActions
											campaign={campaign}
											onEdit={() => setDialog({ open: true, campaign })}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
			{dialog.open && (
				<DialogMarketingCampaign
					key={dialog.campaign?.id ?? 'new'}
					campaign={dialog.campaign}
					open
					onOpenChange={(open) =>
						!open && setDialog({ open: false, campaign: null })
					}
				/>
			)}
		</main>
	);
}

export default MarketingPage;
