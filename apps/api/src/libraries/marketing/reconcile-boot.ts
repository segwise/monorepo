import { database } from '@/services/database';
import { marketingQueue } from './queue';
import { reconcileSchedulers } from './reconcile';

// Chamada no boot (src/index.ts). Não bloqueia o servidor: se o Redis da fila estiver fora, o
// BullMQ espera a conexão voltar.
async function reconcileCampaignSchedules() {
	const result = await reconcileSchedulers(marketingQueue, () =>
		database.marketingCampaign.findMany({
			select: {
				id: true,
				active: true,
				frequency: true,
				dayOfMonth: true,
				hour: true,
			},
		}),
	);

	console.log('[marketing] schedulers reconciliados', result);

	return result;
}

export { reconcileCampaignSchedules };
