import { Hono } from 'hono';
import { trimTrailingSlash } from 'hono/trailing-slash';
import type { AppBindings } from '@/@types/server';
import { authMiddleware } from '@/server/middlewares/auth';
import { cacheMiddleware } from '@/server/middlewares/cache';
import { corsMiddleware } from '@/server/middlewares/cors';
import { databaseMiddleware } from '@/server/middlewares/database';
import { emailMiddleware } from '@/server/middlewares/email';
import { environmentMiddleware } from '@/server/middlewares/environment';

const server = new Hono<AppBindings>({
	strict: true,
	getPath: (req) => {
		const host = req.headers.get('host') || '';
		const subdomain = host.split(':')[0]?.split('.').shift() || '';

		if (!['api', 'services'].includes(subdomain)) {
			return '/__invalid_host__';
		}

		const url = new URL(req.url);
		const path = url.pathname === '/' ? '' : url.pathname;

		return `/${subdomain}${path}`;
	},
});

server.use(trimTrailingSlash());

server.use(corsMiddleware);

server.use(environmentMiddleware);

server.use(cacheMiddleware);
server.use(databaseMiddleware);
server.use(emailMiddleware);

server.use(authMiddleware);

export { server };
