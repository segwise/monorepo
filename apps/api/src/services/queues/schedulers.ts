import { migrationQueue } from './queues';

async function registerSchedulers() {
	await migrationQueue.upsertJobScheduler(
		'daily-migration',
		{
			pattern: '* * * * *',
			tz: 'America/Sao_Paulo',
		},
		{
			name: 'daily-migration',
		},
	);
}

export { registerSchedulers };
