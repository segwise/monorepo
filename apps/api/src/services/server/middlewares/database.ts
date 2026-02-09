import type { MiddlewareHandler } from '@/@types/server.d';
import { database } from '@/services/database';

const databaseMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.database = database;

	return await next();
};

export { databaseMiddleware };
