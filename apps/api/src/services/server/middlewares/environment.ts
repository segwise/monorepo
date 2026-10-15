import type { MiddlewareHandler } from '@/@types/server.d';
import { environment } from '@/libraries/environment';

const environmentMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.environment = environment;

	return await next();
};

export { environmentMiddleware };
