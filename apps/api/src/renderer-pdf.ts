import { Hono } from 'hono';
import { environment } from './libraries/environment';

const server = new Hono();

export default {
	port: Bun.env.PORT,
	fetch: server.fetch,
	...(environment.NODE_ENV === 'development' && {
		idleTimeout: 255,
	}),
};
