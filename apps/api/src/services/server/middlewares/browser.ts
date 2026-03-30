import type { MiddlewareHandler } from '@/@types/server.d';
import { acquirePage } from '@/libraries/pdf/browser';

const browserMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.browser = acquirePage;

	return await next();
};

export { browserMiddleware };
