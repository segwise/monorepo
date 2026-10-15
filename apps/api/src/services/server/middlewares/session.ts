import { cookiesAuthRelevant } from '@segwise/core';
import type { Role } from '@segwise/database/enums';
import type { MiddlewareHandler } from '@/@types/server.d';

const sessionMiddleware: MiddlewareHandler = async (ctx, next) => {
	const session = await ctx.auth.api.getSession({
		headers: ctx.req.raw.headers,
	});

	// Vínculo suspenso ou excluído = sem acesso: a requisição segue como se não houvesse
	// sessão (rotas protegidas respondem 401), sem esperar a sessão expirar.
	// @ts-expect-error
	const brokerStatus = session?.session.brokerStatus as string | undefined;
	const suspended = !!brokerStatus && brokerStatus !== 'active';

	if (session && !suspended) {
		ctx.session = {
			...session.session,
			// @ts-expect-error
			role: session.user.role as unknown as Role,
			// @ts-expect-error
			roleBroker: session.session.brokerRole as unknown as Role | null,
		};
	}

	return await next();
};

const requireSession: MiddlewareHandler = async (ctx, next) => {
	if (!ctx.session) {
		return ctx.json({ message: 'Não autorizado' }, 401);
	}

	if (ctx.session.expiresAt < new Date()) {
		return ctx.json({ message: 'Não autorizado' }, 401);
	}

	return await next();
};

const replaceSession: MiddlewareHandler = async (ctx, next) => {
	const cookies = ctx.req.raw.headers.get('cookie');

	if (cookies) {
		const ACCESS = ctx.req.raw.headers.get('X-Client-App');
		const cookieString = ACCESS
			? cookiesAuthRelevant(
					// @ts-expect-error
					ACCESS,
					cookies ?? '',
				)
			: cookies;

		const environment = ctx.environment.NODE_ENV;
		const targetPrefix =
			environment === 'production' ? 'auth' : `${environment}.auth`;

		const normalized = cookieString?.replace(
			/(?:backoffice|customer|producer|app)\.(?:(?:production|preview|development)\.)?auth/g,
			targetPrefix,
		);

		if (normalized && normalized !== cookieString) {
			ctx.req.raw.headers.set('cookie', normalized);
		}
	}

	return await next();
};

export { replaceSession, requireSession, sessionMiddleware };
