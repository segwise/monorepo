import type { MiddlewareHandler } from '@/@types/server.d';
import { auth } from '@/services/auth';

const authMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.auth = auth;

	return await next();
};

export { authMiddleware };
