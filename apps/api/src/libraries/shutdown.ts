import { shutdownBrowser } from '@/libraries/pdf/browser';
import { cache } from '@/services/cache';
import { database } from '@/services/database';

async function gracefulShutdown() {
	try {
		cache.close();

		await shutdownBrowser();
		await database.$disconnect();
	} catch (err) {
		console.error('Erro durante o shutdown:', err);
	} finally {
		process.exit(0);
	}
}

export { gracefulShutdown };
