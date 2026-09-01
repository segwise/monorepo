import type { MiddlewareHandler } from '@/@types/server.d';
import { getClientTimezone } from '@/libraries/get-client-timezone';

const timezoneMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.timezone = getClientTimezone(ctx);

	console.log(ctx.timezone);

	return await next();
};

export { timezoneMiddleware };
