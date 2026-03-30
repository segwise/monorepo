import { shutdownBrowser } from '@/libraries/pdf/browser';

async function gracefulShutdown() {
	try {
		await shutdownBrowser();
	} catch (err) {
		console.error('Erro durante o shutdown:', err);
	} finally {
		process.exit(0);
	}
}

export { gracefulShutdown };
