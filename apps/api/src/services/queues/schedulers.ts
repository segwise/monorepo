import { migrationQueue, migrationUpdaterQueue } from './queues';

async function registerSchedulers() {
	await migrationQueue.upsertJobScheduler(
		'migration',
		{
			pattern: '0 0 0 * * *',
			tz: 'America/Sao_Paulo',
		},
		{
			name: 'migration',
		},
	);

	await migrationUpdaterQueue.upsertJobScheduler(
		'migration-updater',
		{
			pattern: '0 */5 * * * *',
			tz: 'America/Sao_Paulo',
		},
		{
			name: 'migration-updater',
		},
	);
}

export { registerSchedulers };
