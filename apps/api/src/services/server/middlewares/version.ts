import type { MiddlewareHandler } from '@/@types/server.d';

// SHA do commit desta imagem (build-arg GIT_SHA do Dockerfile). O CD confere este header depois do
// deploy para ter certeza de que é a versão nova que está respondendo, e não uma antiga.
const APP_VERSION = process.env.APP_VERSION ?? 'unknown';

const versionMiddleware: MiddlewareHandler = async (ctx, next) => {
	await next();

	ctx.res.headers.set('X-App-Version', APP_VERSION);
};

export { versionMiddleware };
