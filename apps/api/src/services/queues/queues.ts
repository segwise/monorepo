import { Queue } from 'bullmq';
import { options } from './connection';

const migrationUpdaterQueue = new Queue('migration-updater', {
	...options,
	defaultJobOptions: {
		attempts: 5,
		backoff: {
			type: 'exponential',
			delay: 60_000,
		},
		removeOnComplete: 100,
		removeOnFail: 1000,
	},
});

const migrationRecentQueue = new Queue('migration-recent', {
	...options,
	defaultJobOptions: {
		attempts: 5,
		backoff: {
			type: 'exponential',
			delay: 60_000,
		},
		removeOnComplete: 100,
		removeOnFail: 1000,
	},
});

export { migrationUpdaterQueue, migrationRecentQueue };
