import {
	createBunRedisClient,
	type QueueOptions,
	type WorkerOptions,
} from 'bullmq';
import { environment } from '@/libraries/environment';

const rawClient = new Bun.RedisClient(environment.CACHE_URL);

// @ts-expect-error
const connection = createBunRedisClient(rawClient);

const options: WorkerOptions | QueueOptions = {
	connection,
	prefix: 'bullmq',
};

export { connection, options };
