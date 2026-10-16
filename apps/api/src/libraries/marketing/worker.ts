import { DelayedError, type Job, Worker } from 'bullmq';
import { format } from 'date-fns';
import { isStopping } from '@/libraries/lifecycle';
import { database } from '@/services/database';
import { email } from '@/services/email';
import { findEligibleContacts } from './eligibility';
import { connection, MARKETING_QUEUE } from './queue';
import { buildWhatsappUrl, marketingTemplates } from './templates';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendCampaign(
	job: Job,
	token: string | undefined,
	campaignId: string,
	manual: boolean,
	contactIds?: string[],
) {
	const campaign = await database.marketingCampaign.findUnique({
		where: { id: campaignId },
	});

	if (!campaign || (!campaign.active && !manual)) {
		return { sent: 0 };
	}

	const contacts = await findEligibleContacts(campaign.id, contactIds);

	const template = marketingTemplates[campaign.template];
	const whatsappUrl = buildWhatsappUrl(
		campaign.whatsappPhone,
		campaign.whatsappMessage,
	);
	const day = format(new Date(), 'yyyy-MM-dd');

	let sent = 0;

	for (const contact of contacts) {
		// Processo parando (deploy): em vez de cortar o envio no meio, devolve o job para a fila com
		// alguns segundos de atraso. O container novo retoma; a elegibilidade pula quem já recebeu (cada
		// envio fica em marketingDelivery), então ninguém recebe duas vezes.
		if (isStopping()) {
			await job.moveToDelayed(Date.now() + 5_000, token);
			throw new DelayedError();
		}

		const { data, error } = await email.emails.send(
			{
				from: 'XCAR Corretora <parceria@emails.xcarcorretora.com.br>',
				to: contact.email.toLowerCase(),
				subject: campaign.subject,
				react: template.render({ whatsappUrl }),
			},
			{
				idempotencyKey: `marketing:${campaign.id}:${contact.id}:${day}${manual ? `:${Date.now()}` : ''}`,
			},
		);

		await database.marketingDelivery.create({
			data: {
				campaignId: campaign.id,
				contactId: contact.id,
				resendId: data?.id ?? null,
				status: error ? 'failed' : 'sent',
				error: error?.message ?? null,
			},
		});

		if (!error) {
			sent += 1;
		}

		await sleep(300);
	}

	await database.marketingCampaign.update({
		where: { id: campaign.id },
		data: { lastRunAt: new Date() },
	});

	return { sent };
}

const marketingWorker = new Worker(
	MARKETING_QUEUE,
	async (job, token) => {
		if (job.name === 'send-campaign') {
			return await sendCampaign(
				job,
				token,
				job.data.campaignId,
				!!job.data.manual,
				job.data.contactIds,
			);
		}
	},
	{ connection, concurrency: 1 },
);

marketingWorker.on('failed', (job, error) => {
	console.error(`[marketing] job ${job?.id} falhou:`, error.message);
});

export { marketingWorker };
