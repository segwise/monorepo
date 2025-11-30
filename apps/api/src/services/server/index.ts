import { Hono } from 'hono';
import type { AppBindings } from '@/@types/server';
import { cacheMiddleware } from '@/server/middlewares/cache';
import { corsAuthMiddleware, corsMiddleware } from '@/server/middlewares/cors';
import { databaseMiddleware } from '@/server/middlewares/database';
import { emailMiddleware } from '@/server/middlewares/email';
import { environmentMiddleware } from '@/server/middlewares/environment';

const server = new Hono<AppBindings>({
	strict: false,
});

server.use(corsMiddleware);
server.use('/auth/*', corsAuthMiddleware);
server.use(environmentMiddleware);

server.use(cacheMiddleware);
server.use(databaseMiddleware);
server.use(emailMiddleware);

export { server };
