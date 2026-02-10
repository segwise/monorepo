import type { MiddlewareHandler } from '@/@types/server.d';

import { storage as documents } from '@/services/storage/documents';
import { storage as images } from '@/services/storage/images';

const storageMiddleware: MiddlewareHandler = async (ctx, next) => {
	ctx.storage = {
		images,
		documents,
	};

	return await next();
};

export { storageMiddleware };
