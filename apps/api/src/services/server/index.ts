import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';
import type { AppBindings } from '@/@types/server.d';
import { environment } from '@/libraries/environment';
import { authMiddleware } from '@/server/middlewares/auth';
import { cacheMiddleware } from '@/server/middlewares/cache';
import { corsMiddleware } from '@/server/middlewares/cors';
import { databaseMiddleware } from '@/server/middlewares/database';
import { emailMiddleware } from '@/server/middlewares/email';
import { environmentMiddleware } from '@/server/middlewares/environment';
import { errorMiddleware } from '@/server/middlewares/error';
import {
	replaceSession,
	sessionMiddleware,
} from '@/server/middlewares/session';
import { storageMiddleware } from '@/server/middlewares/storage';

const server = new Hono<AppBindings>({
	strict: true,
	getPath: (req) => {
		const host = req.headers.get('host') || '';

		const domain = host.split(':')[0]?.split('.').shift();

		const subdomain = domain === 'localhost' ? 'services' : domain;

		if (!subdomain || !['api', 'services'].includes(subdomain)) {
			return '/__invalid_host__';
		}

		const url = new URL(req.url);
		const path = url.pathname === '/' ? '' : url.pathname;

		const fullPath = `/${subdomain}${path}`;

		return fullPath;
	},
});

server.use(trimTrailingSlash());

server.use(corsMiddleware);

server.use(environmentMiddleware);

server.use(replaceSession);

server.use(cacheMiddleware);
server.use(databaseMiddleware);
server.use(emailMiddleware);

server.use(storageMiddleware);

server.use(authMiddleware);
server.use(sessionMiddleware);

if (environment.NODE_ENV !== 'production') {
	server.use(logger());
}

server.onError(errorMiddleware);

export { server };
