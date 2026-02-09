import type { MiddlewareHandler } from '@/@types/server.d';
import { email } from '@/services/email';

const emailMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.email = email;

	return await next();
};

export { emailMiddleware };
