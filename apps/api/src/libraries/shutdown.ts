import type { Server } from 'bun';
import { isStopping, markStopping } from '@/libraries/lifecycle';
import { connection, marketingQueue } from '@/libraries/marketing/queue';
import { marketingWorker } from '@/libraries/marketing/worker';
import { cache } from '@/services/cache';
import { database } from '@/services/database';

// No deploy o Docker manda SIGTERM e espera o `stop_grace_period` do compose (30 s) antes do SIGKILL.
// Saída forçada um pouco antes disso, se algo travar.
const FORCE_EXIT_MS = 25_000;

async function gracefulShutdown(httpServer: Server<unknown>, signal: string) {
	if (isStopping()) return;

	markStopping();
	console.log(`[shutdown] ${signal}: encerrando`);

	const force = setTimeout(() => {
		console.error('[shutdown] tempo esgotado, saída forçada');
		process.exit(1);
	}, FORCE_EXIT_MS);

	try {
		// Para de aceitar conexões e espera as requisições em andamento (Bun 1.4+).
		await httpServer.stop();
		// O job ativo para no próximo contato e volta para a fila (ver marketing/worker.ts).
		await marketingWorker.close();
		await marketingQueue.close();
		await connection.quit();
		cache.close();
		await database.$disconnect();
		console.log('[shutdown] concluído');
	} catch (error) {
		console.error('[shutdown] erro ao encerrar:', error);
	} finally {
		clearTimeout(force);
		process.exit(0);
	}
}

export { gracefulShutdown };
