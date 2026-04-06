import type { Session } from 'better-auth';
import type { Server } from '@/@types/server.d';
import { Role } from '@/generated/prisma/enums';

const pathnameIgnoresSession = ['/auth/reset-password'];

function registerRoutersServicesAuth(server: Server) {
	const base = server.basePath('/auth');

	base.on(['POST', 'GET'], '*', async (ctx) => {
		const XClientApp = (ctx.req.header('X-Client-App') ||
			ctx.req.raw.headers.get('X-Client-App')) as
			| 'admin'
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
					token: string;
					user: {
						id: string;
						role: Role;
					};
					session: Session & {
						brokerRole?: Role | null;
					};
				});

		const setCookies = response.headers.getSetCookie();

		console.log(session, ctx.session);
		const role = session?.user?.role || ctx?.session?.role;
		const roleBroker =
			session?.session?.brokerRole ||
			ctx?.session?.brokerRole ||
			session?.user?.role === Role.customer
				? await ctx.database.session
						.findUnique({
							where: {
								token: session?.token,
							},
							select: {
								activeBroker: {
									select: {
										members: {
											where: {
												userId: session?.user?.id || ctx?.session?.id,
											},
											select: {
												role: true,
											},
										},
									},
								},
							},
						})
						.then((response) => response?.activeBroker?.members[0]?.role)
				: undefined;

		const isBackoffice =
			role === Role.admin ||
			role === Role.manager ||
			role === Role.finance ||
			role === Role.counter;

		const isCustomer = role === Role.customer;

		const isProducer = roleBroker === Role.producer;

		if (
			(isBackoffice && XClientApp !== 'admin') ||
			(isCustomer && !isProducer && XClientApp !== 'customer') ||
			(isProducer && XClientApp !== 'producer')
		) {
			const cloneResponse = response.clone();

			const responseSignOut = await ctx.auth.api.signOut({
				headers: cloneResponse.headers,
				asResponse: true,
			});

			return new Response(
				JSON.stringify({
					code: 'INVALID_EMAIL_OR_PASSWORD',
					message: 'Invalid email or password',
				}),
				{
					...responseSignOut,
					status: 401,
					statusText: 'Unauthorized',
				},
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
						} else {
							cookie = cookie.replace(
								`__Secure-${ctx.environment.NODE_ENV}.auth.session_token`,
								`__Secure-backoffice.${ctx.environment.NODE_ENV}.auth.session_token`,
							);
						}
					}

					if (isProducer) {
						if (ctx.environment.NODE_ENV === 'production') {
							cookie = cookie.replace(
								'__Secure-auth.session_token',
								'__Secure-producer.auth.session_token',
							);
						} else {
							cookie = cookie.replace(
								`__Secure-${ctx.environment.NODE_ENV}.auth.session_token`,
								`__Secure-producer.${ctx.environment.NODE_ENV}.auth.session_token`,
							);
						}
					}

					if (isCustomer) {
						if (ctx.environment.NODE_ENV === 'production') {
							cookie = cookie.replace(
								'__Secure-auth.session_token',
								'__Secure-customer.auth.session_token',
							);
						} else {
							cookie = cookie.replace(
								`__Secure-${ctx.environment.NODE_ENV}.auth.session_token`,
								`__Secure-customer.${ctx.environment.NODE_ENV}.auth.session_token`,
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
