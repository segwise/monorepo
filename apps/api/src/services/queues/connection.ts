import {
	createBunRedisClient,
	type QueueOptions,
	type WorkerOptions,
} from 'bullmq';
import { cache } from '../cache';

// @ts-expect-error
const connection = createBunRedisClient(cache);

const options: WorkerOptions | QueueOptions = {
	connection,
	prefix: 'bullmq',
};

export { connection, options };
