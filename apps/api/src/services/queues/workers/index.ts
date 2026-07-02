import { Worker } from 'bullmq';
import { cache } from '../../cache';
import { options } from '../connection';
import { migration } from './migration';

function startWorkers() {
	new Worker(
		'migration',
		async () => {
			await migration();

			await cache.set('migration:last-execution', new Date().toISOString());
		},
		options,
	);
}

export { startWorkers };
