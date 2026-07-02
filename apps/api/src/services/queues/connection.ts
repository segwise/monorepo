import {
	createBunRedisClient,
	type QueueOptions,
	type WorkerOptions,
} from 'bullmq';
import { environment } from '@/libraries/environment';

const connection = createBunRedisClient(
	// @ts-expect-error
	new Bun.RedisClient(environment.CACHE_QUEUE_URL),
);

const options: WorkerOptions | QueueOptions = {
	connection,
	prefix: 'bullmq',
};

export { connection, options };
