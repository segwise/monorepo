import type { Server } from '@/@types/server.d';
import { Role } from '@/generated/prisma/enums';

const pathnameIgnoresSession = ['/auth/reset-password'];

function registerRoutersServicesAuth(server: Server) {
	const base = server.basePath('/auth');

	base.on(['POST', 'GET'], '*', async (ctx) => {
		const response = await ctx.auth.handler(ctx.req.raw);

		const shouldIgnoreSession = pathnameIgnoresSession.some(
			(ignoredPath) =>
				ctx.req.url.includes(ignoredPath) ||
				ctx.req.url.startsWith(ignoredPath),
		);

		const session = shouldIgnoreSession
			? null
			: ((await response.clone().json()) as {
					user: {
						role: Role;
					};
				});

		const setCookies = response.headers.getSetCookie();

		const role = session?.user?.role || ctx?.session?.role;

		if (setCookies.length) {
			if (
				(ctx.req.url?.includes('/auth/sign-out') ||
					ctx.req.url?.includes('/auth/sign-in/email')) &&
				role
			) {
				const modifiedCookies = setCookies.map((cookieStr) => {
					let cookie = cookieStr;

					if (
						role === Role.owner ||
						role === Role.admin ||
						role === Role.broker ||
						role === Role.counter ||
						role === Role.finance ||
						role === Role.producer
					) {
						if (ctx.environment.NODE_ENV === 'production') {
							cookie = cookie.replace(
								'__Secure-auth.session_token',
								'__Secure-backoffice.auth.session_token',
							);
						}

						if (ctx.environment.NODE_ENV === 'preview') {
							cookie = cookie.replace(
								'__Secure-preview.auth.session_token',
								'__Secure-backoffice.preview.auth.session_token',
							);
						}

						if (ctx.environment.NODE_ENV === 'development') {
							cookie = cookie.replace(
								'__Secure-development.auth.session_token',
								'__Secure-backoffice.development.auth.session_token',
							);
						}
					}

					if (role === Role.customer) {
						if (ctx.environment.NODE_ENV === 'production') {
							cookie = cookie.replace(
								'__Secure-auth.session_token',
								'__Secure-customer.auth.session_token',
							);
						}

						if (ctx.environment.NODE_ENV === 'preview') {
							cookie = cookie.replace(
								'__Secure-preview.auth.session_token',
								'__Secure-customer.preview.auth.session_token',
							);
						}

						if (ctx.environment.NODE_ENV === 'development') {
							cookie = cookie.replace(
								'__Secure-development.auth.session_token',
								'__Secure-customer.development.auth.session_token',
							);
						}
					}

					return cookie;
				});

				response.headers.delete('set-cookie');

				modifiedCookies.forEach((ctx) => {
					response.headers.append('set-cookie', ctx);
				});
			}
		}

		return response;
	});
}

export { registerRoutersServicesAuth };
