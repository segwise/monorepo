import type { MiddlewareHandler } from '@/@types/server.d';

import type { Role } from '@/generated/prisma/enums';

const sessionMiddleware: MiddlewareHandler = async (ctx, next) => {
	const session = await ctx.auth.api.getSession({
		headers: ctx.req.raw.headers,
	});

	if (session) {
		ctx.session = {
			...session.session,
			// @ts-expect-error
			role: session.user.role as unknown as Role,
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

	if (
		cookies?.includes('backoffice.auth') ||
		cookies?.includes('producer.auth') ||
		cookies?.includes('customer.auth') ||
		cookies?.includes(`backoffice.${ctx.environment.NODE_ENV}.auth`) ||
		cookies?.includes(`producer.${ctx.environment.NODE_ENV}.auth`) ||
		cookies?.includes(`customer.${ctx.environment.NODE_ENV}.auth`)
	) {
		const prefix =
			ctx.environment.NODE_ENV === 'production'
				? 'auth'
				: `${ctx.environment.NODE_ENV}.auth`;

		const modifiedCookies =
			cookies
				?.replaceAll('backoffice.auth', prefix)
				.replaceAll(`backoffice.${ctx.environment.NODE_ENV}.auth`, prefix)
				.replaceAll(`producer.auth`, prefix)
				.replaceAll(`producer.${ctx.environment.NODE_ENV}.auth`, prefix)
				.replaceAll(`customer.auth`, prefix)
				.replaceAll(`customer.${ctx.environment.NODE_ENV}.auth`, prefix) || '';

		ctx.req.raw.headers.set('cookie', modifiedCookies);
	}

	return await next();
};

export { sessionMiddleware, requireSession, replaceSession };
