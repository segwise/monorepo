import {
	migrationQueue,
	migrationRecentQueue,
	migrationUpdaterQueue,
} from './queues';

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
			pattern: '0 */10 * * * *',
			tz: 'America/Sao_Paulo',
		},
		{
			name: 'migration-updater',
		},
	);

	await migrationRecentQueue.upsertJobScheduler(
		'migration-recent',
		{
			pattern: '0 */1 * * * *',
			tz: 'America/Sao_Paulo',
		},
		{
			name: 'migration-recent',
		},
	);
}

export { registerSchedulers };
