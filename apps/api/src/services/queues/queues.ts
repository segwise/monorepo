import { Queue } from 'bullmq';
import { options } from './connection';

const migrationQueue = new Queue('migration', {
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

export { migrationQueue };
