import '@/libraries/force-utc';
import '@/libraries/marketing/worker';
import { reconcileCampaignSchedules } from '@/libraries/marketing/reconcile-boot';
import { gracefulShutdown } from '@/libraries/shutdown';
import { registerRouters } from '@/routers';
import { server } from '@/server';
import { environment } from './libraries/environment';

registerRouters(server);

// Refaz no Redis da fila os schedulers das campanhas (perda/restauração do Redis, exclusão em
// cascata). Em segundo plano: não atrasa nem derruba o boot.
reconcileCampaignSchedules().catch((error) => {
	console.error('[marketing] falha ao reconciliar os schedulers', error);
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default {
	port: Bun.env.PORT,
	fetch: server.fetch,
	...(environment.NODE_ENV === 'development' && {
		idleTimeout: 255,
	}),
};
