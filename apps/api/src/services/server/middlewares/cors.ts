import { cors } from 'hono/cors';
import type { MiddlewareHandler } from '@/@types/server';
import { environment } from '@/libraries/environment';

const corsDefaultMiddleware: MiddlewareHandler = cors({
	origin: environment.URL_APPLICATION,
	credentials: true,
});

const corsAuthMiddleware: MiddlewareHandler = cors({
	origin: environment.URL_APPLICATION,
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['POST', 'GET', 'OPTIONS'],
	exposeHeaders: ['Content-Length'],
	maxAge: 600,
	credentials: true,
});

const corsApiMiddleware: MiddlewareHandler = cors({
	origin: '*',
});

const corsMiddleware: MiddlewareHandler = async (ctx, next) => {
	if (ctx.req.path.startsWith('/api')) {
		return await corsApiMiddleware(ctx, next);
	}

	if (ctx.req.path.startsWith('/auth')) {
		return await corsAuthMiddleware(ctx, next);
	}

	return await corsDefaultMiddleware(ctx, next);
};

export { corsMiddleware };
