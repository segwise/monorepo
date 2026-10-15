import type { MiddlewareHandler } from '@/@types/server.d';

import { transfeera as request } from '@/services/pix/transfeera';

const transfeeraMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.transfeera = request;

	return await next();
};

export { transfeeraMiddleware };
