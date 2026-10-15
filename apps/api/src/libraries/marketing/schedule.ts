import type { MarketingFrequency } from '@segwise/database/enums';
import type { Queue } from 'bullmq';

const TIMEZONE = 'America/Sao_Paulo';

// O ID do job scheduler do BullMQ é o `key` devolvido por `getJobSchedulers()` (o campo `id`
// vem vazio). Todo scheduler de campanha começa com este prefixo: a reconciliação só mexe nesses.
const SCHEDULER_PREFIX = 'campaign:';

type CampaignSchedule = {
	id: string;
	active: boolean;
	frequency: MarketingFrequency;
	dayOfMonth: number | null;
	hour: number;
};

type ScheduleQueue = Pick<Queue, 'upsertJobScheduler' | 'removeJobScheduler'>;

function schedulerIdOf(campaignId: string) {
	return `${SCHEDULER_PREFIX}${campaignId}`;
}

function buildCronPattern(
	campaign: Pick<CampaignSchedule, 'frequency' | 'dayOfMonth' | 'hour'>,
) {
	return campaign.frequency === 'monthly'
		? `0 ${campaign.hour} ${campaign.dayOfMonth ?? 1} * *`
		: `0 ${campaign.hour} * * *`;
}

// Cria/atualiza o scheduler da campanha ativa ou remove o da inativa. Idempotente.
async function applyCampaignSchedule(
	queue: ScheduleQueue,
	campaign: CampaignSchedule,
) {
	const schedulerId = schedulerIdOf(campaign.id);

	if (!campaign.active) {
		await queue.removeJobScheduler(schedulerId);

		return;
	}

	await queue.upsertJobScheduler(
		schedulerId,
		{ pattern: buildCronPattern(campaign), tz: TIMEZONE },
		{ name: 'send-campaign', data: { campaignId: campaign.id } },
	);
}

export type { CampaignSchedule, ScheduleQueue };
export {
	applyCampaignSchedule,
	buildCronPattern,
	SCHEDULER_PREFIX,
	schedulerIdOf,
	TIMEZONE,
};
