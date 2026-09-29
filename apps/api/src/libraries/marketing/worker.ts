import { Worker } from 'bullmq';
import { format } from 'date-fns';
import { database } from '@/services/database';
import { email } from '@/services/email';
import { connection, MARKETING_QUEUE } from './queue';
import { buildWhatsappUrl, marketingTemplates } from './templates';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendCampaign(campaignId: string, manual: boolean) {
	const campaign = await database.marketingCampaign.findUnique({
		where: { id: campaignId },
		include: { contacts: true },
	});

	if (!campaign || (!campaign.active && !manual)) {
		return { sent: 0 };
	}

	const template = marketingTemplates[campaign.template];
	const whatsappUrl = buildWhatsappUrl(
		campaign.whatsappPhone,
		campaign.whatsappMessage,
	);
	const day = format(new Date(), 'yyyy-MM-dd');

	let sent = 0;

	for (const contact of campaign.contacts) {
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
	async (job) => {
		if (job.name === 'send-campaign') {
			return await sendCampaign(job.data.campaignId, !!job.data.manual);
		}
	},
	{ connection, concurrency: 1 },
);

marketingWorker.on('failed', (job, error) => {
	console.error(`[marketing] job ${job?.id} falhou:`, error.message);
});

export { marketingWorker };
