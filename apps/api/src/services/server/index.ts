import { Hono } from 'hono';
import type { AppBindings } from '@/@types/server';
import { cacheMiddleware } from '@/server/middlewares/cache';
import {
	corsApiMiddleware,
	corsAuthMiddleware,
	corsMiddleware,
} from '@/server/middlewares/cors';
import { databaseMiddleware } from '@/server/middlewares/database';
import { emailMiddleware } from '@/server/middlewares/email';
import { environmentMiddleware } from '@/server/middlewares/environment';

const server = new Hono<AppBindings>({
	strict: false,
	getPath: (req) => {
		console.log(req);

		return '/';
	},
});

server.use('/api/*', corsApiMiddleware);
server.use('/auth/*', corsAuthMiddleware);
server.use(corsMiddleware);

server.use(environmentMiddleware);

server.use(cacheMiddleware);
server.use(databaseMiddleware);
server.use(emailMiddleware);

server.get('/', (ctx) => {
	return ctx.json({});
});

export { server };
