import { Worker } from 'bullmq';
import { options } from '../connection';
import { migration, migrationUpdater } from './migration';

function startWorkers() {
	new Worker('migration', migration, {
		...options,
		name: 'migration',
	});

	new Worker('migration-updater', migrationUpdater, {
		...options,
		name: 'migration-updater',
	});
}

export { startWorkers };
