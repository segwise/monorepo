import { cors } from 'hono/cors';
import type { MiddlewareHandler } from '@/@types/server.d';
import { getMainDomain } from '@/functions/hostname/get-main-domain';
import { environment } from '@/libraries/environment';

const mainDomain = getMainDomain(environment.APPLICATION_URL);

const isAllowedOrigin = (origin: string | null | undefined): string | null => {
	if (!origin) {
		return null;
	}

	if (
		environment.NODE_ENV === 'development' &&
		(origin.includes('localhost') || origin.includes('127.0.0.1'))
	) {
		return origin;
	}

	try {
		const url = new URL(origin);

		const hostname = url.hostname;

		if (hostname === mainDomain || hostname.endsWith(`.${mainDomain}`)) {
			return origin;
		}

		return null;
	} catch {
		return null;
	}
};

const corsDefaultMiddleware: MiddlewareHandler = cors({
	origin: isAllowedOrigin,
	credentials: true,
	allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
	allowHeaders: [
		'Content-Type',
		'Authorization',
		'X-Client-App',
		'X-timezone',
		'X-Requested-With',
	],
});

const corsAuthMiddleware: MiddlewareHandler = cors({
	origin: isAllowedOrigin,
	credentials: true,
	allowHeaders: ['Content-Type', 'Authorization', 'X-Client-App', 'X-timezone'],
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
