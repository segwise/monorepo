import '@/libraries/force-utc';
import '@/libraries/marketing/worker';
import { gracefulShutdown } from '@/libraries/shutdown';
import { registerRouters } from '@/routers';
import { server } from '@/server';
import { environment } from './libraries/environment';

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
