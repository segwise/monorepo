import type { Queue } from 'bullmq';
import {
	applyCampaignSchedule,
	type CampaignSchedule,
	SCHEDULER_PREFIX,
	schedulerIdOf,
} from './schedule';

type ReconcileQueue = Pick<
	Queue,
	'upsertJobScheduler' | 'removeJobScheduler' | 'getJobSchedulers'
>;

type ReconcileResult = {
	scheduled: number;
	removedInactive: number;
	removedOrphans: number;
};

/**
 * Faz o Redis da fila refletir o banco: os schedulers `campaign:<id>` só eram sincronizados ao
 * criar/editar/pausar/excluir a campanha, então perder o Redis (ou restaurar um backup antigo)
 * deixava campanhas ativas sem envio, ou schedulers de campanhas já apagadas (inclusive por
 * cascata, ao excluir a corretora).
 *
 * - campanha ativa: cria/atualiza o scheduler;
 * - campanha inativa: remove o scheduler;
 * - scheduler `campaign:*` sem campanha no banco (órfão): remove.
 *
 * Os schedulers são listados ANTES de ler as campanhas: uma campanha criada no meio do caminho
 * não está na lista, então nunca é tratada como órfã. Idempotente; roda a cada boot.
 */
async function reconcileSchedulers(
	queue: ReconcileQueue,
	loadCampaigns: () => Promise<CampaignSchedule[]>,
): Promise<ReconcileResult> {
	const existing = await queue.getJobSchedulers(0, -1);
	const campaigns = await loadCampaigns();
	const known = new Set(
		campaigns.map((campaign) => schedulerIdOf(campaign.id)),
	);

	let scheduled = 0;
	let removedInactive = 0;

	for (const campaign of campaigns) {
		if (campaign.active) {
			await applyCampaignSchedule(queue, campaign);
			scheduled += 1;
		} else if (await queue.removeJobScheduler(schedulerIdOf(campaign.id))) {
			removedInactive += 1;
		}
	}

	let removedOrphans = 0;

	for (const scheduler of existing) {
		// `key` é o ID do scheduler; só os de campanha são nossos (a fila pode ter outros).
		if (
			!scheduler.key.startsWith(SCHEDULER_PREFIX) ||
			known.has(scheduler.key)
		) {
			continue;
		}

		if (await queue.removeJobScheduler(scheduler.key)) {
			removedOrphans += 1;
		}
	}

	return { scheduled, removedInactive, removedOrphans };
}

export type { ReconcileResult };
export { reconcileSchedulers };
