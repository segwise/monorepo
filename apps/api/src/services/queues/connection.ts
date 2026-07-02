import type { QueueOptions, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { environment } from '@/libraries/environment';

const connection = new IORedis(environment.CACHE_URL, {
	maxRetriesPerRequest: null,
});

const options: WorkerOptions | QueueOptions = {
	// @ts-expect-error
	connection,
	prefix: 'bullmq',
};

export { connection, options };
