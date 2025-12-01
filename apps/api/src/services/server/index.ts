import { Hono } from 'hono';
import type { AppBindings } from '@/@types/server';
import { authMiddleware } from '@/server/middlewares/auth';
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
});

server.use('/^(?!/api(/|$)|/auth(/|$)).*$/', corsMiddleware);
server.use('/api/*', corsApiMiddleware);
server.use('/auth/*', corsAuthMiddleware);

server.use(environmentMiddleware);

server.use(cacheMiddleware);
server.use(databaseMiddleware);
server.use(emailMiddleware);

server.use(authMiddleware);

export { server };
