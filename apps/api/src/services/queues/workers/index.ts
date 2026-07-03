import { Worker } from 'bullmq';
import { options } from '../connection';
import { migrationRecent, migrationUpdater } from './migration';

function startWorkers() {
	new Worker('migration-updater', migrationUpdater, {
		...options,
		name: 'migration-updater',
	});

	new Worker('migration-recent', migrationRecent, {
		...options,
		name: 'migration-recent',
	});
}

export { startWorkers };
