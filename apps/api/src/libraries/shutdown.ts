import { shutdownBrowser } from '@/libraries/pdf/browser';

async function gracefulShutdown() {
	try {
		await shutdownBrowser();
	} finally {
		process.exit(0);
	}
}

export { gracefulShutdown };
