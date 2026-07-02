import { cache } from '../cache';
import { migrationQueue } from './queues';
import { getTodayInSaoPaulo } from './utils';

async function checkMissedJobs() {
	const lastExecution = await cache.get('migration:last-execution');

	const today = getTodayInSaoPaulo();

	if (lastExecution !== today) {
		await migrationQueue.add(
			'daily-migration',
			{},
			{
				jobId: `migration-${today}`,
			},
		);
	}
}

export { checkMissedJobs };
