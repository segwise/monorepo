import type { Session } from 'better-auth';
import type { Server } from '@/@types/server.d';
import { Role, RoleMember } from '@/generated/prisma/enums';

const pathnameIgnoresSession = ['/auth/reset-password'];

function registerRoutersServicesAuth(server: Server) {
	const base = server.basePath('/auth');

	base.on(['POST', 'GET'], '*', async (ctx) => {
		const XClientApp = (ctx.req.header('X-Client-App') ||
			ctx.req.raw.headers.get('X-Client-App')) as
			| 'backoffice'
			| 'producer'
			| 'customer';

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
					session: Session & {
						brokerRole?: RoleMember | null;
					};
				});

		const setCookies = response.headers.getSetCookie();

		const role = session?.user?.role || ctx?.session?.role;
		const roleBroker = session?.session?.brokerRole || ctx?.session?.brokerRole;

		const isBackoffice =
			role === Role.admin ||
			role === Role.manager ||
			role === Role.finance ||
			role === Role.counter;

		const isProducer =
			role === Role.producer || roleBroker === RoleMember.producer;

		const isCustomer = role === Role.customer;

		if (
			(isBackoffice && XClientApp !== 'backoffice') ||
			(isProducer && XClientApp !== 'producer') ||
			(isCustomer && XClientApp !== 'customer')
		) {
			await ctx.auth.api.signOut({
				headers: response.clone().headers,
			});

			return ctx.json(
				{
					code: 'INVALID_EMAIL_OR_PASSWORD',
					message: 'Invalid email or password',
				},
				401,
			);
		}

		if (setCookies.length) {
			if (
				(ctx.req.url?.includes('/auth/sign-out') ||
					ctx.req.url?.includes('/auth/sign-in/email')) &&
				role
			) {
				const modifiedCookies = setCookies.map((cookieStr) => {
					let cookie = cookieStr;

					if (isBackoffice) {
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

					if (isProducer) {
						if (ctx.environment.NODE_ENV === 'production') {
							cookie = cookie.replace(
								'__Secure-auth.session_token',
								'__Secure-producer.auth.session_token',
							);
						}

						if (ctx.environment.NODE_ENV === 'preview') {
							cookie = cookie.replace(
								'__Secure-preview.auth.session_token',
								'__Secure-producer.preview.auth.session_token',
							);
						}

						if (ctx.environment.NODE_ENV === 'development') {
							cookie = cookie.replace(
								'__Secure-development.auth.session_token',
								'__Secure-producer.development.auth.session_token',
							);
						}
					}

					if (isCustomer) {
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
