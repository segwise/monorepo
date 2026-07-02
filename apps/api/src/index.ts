import { gracefulShutdown } from '@/libraries/shutdown';
import { registerRouters } from '@/routers';
import { server } from '@/server';
import { environment } from './libraries/environment';
import { checkMissedJobs } from './services/queues/check-missed';
import { registerSchedulers } from './services/queues/schedulers';
import { startWorkers } from './services/queues/workers';

startWorkers();

await registerSchedulers();
await checkMissedJobs();

registerRouters(server);

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default {
	port: Bun.env.PORT,
	fetch: server.fetch,
	...(environment.NODE_ENV === 'development' && {
		idleTimeout: 255,
	}),
};
