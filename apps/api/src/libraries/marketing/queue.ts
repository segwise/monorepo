import { createBunRedisClient, Queue } from 'bullmq';
import { environment } from '@/libraries/environment';
import {
	applyCampaignSchedule,
	type CampaignSchedule,
	schedulerIdOf,
} from './schedule';

const MARKETING_QUEUE = 'marketing';

// Cliente Redis nativo do Bun (o mesmo do cache), pelo adaptador oficial do BullMQ. O worker usa um
// `duplicate()` dele para os comandos bloqueantes. Feche sempre pelo adaptador (`connection.quit()`),
// nunca pelo cliente cru: senão os comandos em andamento falham com ConnectionClosedError.
const connection = createBunRedisClient(
	new Bun.RedisClient(environment.QUEUE_URL),
);

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
