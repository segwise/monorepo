import { cors } from 'hono/cors';
import type { MiddlewareHandler } from '@/@types/server.d';
import { environment } from '@/libraries/environment';

const corsDefaultMiddleware: MiddlewareHandler = cors({
	origin: environment.APPLICATION_URL,
	credentials: true,
});

const corsAuthMiddleware: MiddlewareHandler = cors({
	origin: environment.APPLICATION_URL,
	credentials: true,
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['POST', 'GET', 'OPTIONS'],
	exposeHeaders: ['Content-Length'],
	maxAge: 600,
});

const corsApiMiddleware: MiddlewareHandler = cors({
	origin: '*',
});

const corsMiddleware: MiddlewareHandler = async (ctx, next) => {
	if (ctx.req.path.includes('/api')) {
		return await corsApiMiddleware(ctx, next);
	}

	if (ctx.req.path.includes('/services/auth')) {
		return await corsAuthMiddleware(ctx, next);
	}

	return await corsDefaultMiddleware(ctx, next);
};

export { corsMiddleware };
