import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { MarketingFrequency } from '@segwise/database/enums';
import { environment } from '@/libraries/environment';

const MARKETING_QUEUE = 'marketing';
const TIMEZONE = 'America/Sao_Paulo';

const connection = new IORedis(environment.QUEUE_URL, {
	maxRetriesPerRequest: null,
});

const marketingQueue = new Queue(MARKETING_QUEUE, { connection });

function buildCronPattern(campaign: {
	frequency: MarketingFrequency;
	dayOfMonth: number | null;
	hour: number;
}) {
	return campaign.frequency === 'monthly'
		? `0 ${campaign.hour} ${campaign.dayOfMonth ?? 1} * *`
		: `0 ${campaign.hour} * * *`;
}

async function syncCampaignSchedule(campaign: {
	id: string;
	active: boolean;
	frequency: MarketingFrequency;
	dayOfMonth: number | null;
	hour: number;
}) {
	const schedulerId = `campaign:${campaign.id}`;

	if (!campaign.active) {
		await marketingQueue.removeJobScheduler(schedulerId);

		return;
	}

	await marketingQueue.upsertJobScheduler(
		schedulerId,
		{ pattern: buildCronPattern(campaign), tz: TIMEZONE },
		{ name: 'send-campaign', data: { campaignId: campaign.id } },
	);
}

async function removeCampaignSchedule(campaignId: string) {
	await marketingQueue.removeJobScheduler(`campaign:${campaignId}`);
}

async function enqueueCampaignNow(campaignId: string, contactIds?: string[]) {
	await marketingQueue.add(
		'send-campaign',
		{ campaignId, manual: true, ...(contactIds && { contactIds }) },
		{ removeOnComplete: 50, removeOnFail: 100 },
	);
}

export {
	connection,
	marketingQueue,
	MARKETING_QUEUE,
	syncCampaignSchedule,
	removeCampaignSchedule,
	enqueueCampaignNow,
};
