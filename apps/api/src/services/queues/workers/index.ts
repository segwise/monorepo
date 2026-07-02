import { Worker } from 'bullmq';
import { options } from '../connection';
import { migration, migrationUpdater } from './migration';

function startWorkers() {
	new Worker(
		'migration',
		async () => {
			console.log('Migration iniciada...');

			const start = performance.now();

			await migration();

			const duration = performance.now() - start;

			console.log(`Migration finalizada em ${(duration / 1000).toFixed(2)}s`);
		},
		{
			...options,
			name: 'migration',
		},
	);

	new Worker(
		'migration-updater',
		async () => {
			console.log('Migration Updater iniciada...');

			const start = performance.now();

			await migrationUpdater();

			const duration = performance.now() - start;

			console.log(
				`Migration Updater finalizada em ${(duration / 1000).toFixed(2)}s`,
			);
		},
		{
			...options,
			name: 'migration-updater',
		},
	);
}

export { startWorkers };
