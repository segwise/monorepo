import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { environment } from '@/libraries/environment';
import {
	applyCampaignSchedule,
	type CampaignSchedule,
	schedulerIdOf,
} from './schedule';

const MARKETING_QUEUE = 'marketing';

const connection = new IORedis(environment.QUEUE_URL, {
	maxRetriesPerRequest: null,
});

const marketingQueue = new Queue(MARKETING_QUEUE, { connection });

async function syncCampaignSchedule(campaign: CampaignSchedule) {
	await applyCampaignSchedule(marketingQueue, campaign);
}

async function removeCampaignSchedule(campaignId: string) {
	await marketingQueue.removeJobScheduler(schedulerIdOf(campaignId));
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
	enqueueCampaignNow,
	MARKETING_QUEUE,
	marketingQueue,
	removeCampaignSchedule,
	syncCampaignSchedule,
};
