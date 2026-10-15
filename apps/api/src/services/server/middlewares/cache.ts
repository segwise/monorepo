import type { MiddlewareHandler } from '@/@types/server.d';
import { cache } from '@/services/cache';

const cacheMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.cache = cache;

	return await next();
};

export { cacheMiddleware };
