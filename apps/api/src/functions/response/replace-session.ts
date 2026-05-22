import type { Session } from 'better-auth';
import type { Context } from '@/@types/server';
import { Role } from '@/generated/prisma/enums';

const pathnameIgnoresSession = [
	'/auth/reset-password',
	'/auth/verify-email',
	'/auth/sign-out',
	'/auth/profile',
];

async function responseReplaceSession(response: Response, ctx: Context) {
	const XClientApp = (ctx.req.header('X-Client-App') ||
		ctx.req.raw.headers.get('X-Client-App')) as
		| 'admin'
		| 'producer'
		| 'customer';

	const shouldIgnoreSession = pathnameIgnoresSession.some(
		(ignoredPath) =>
			ctx.req.url.includes(ignoredPath) || ctx.req.url.startsWith(ignoredPath),
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

	const role = session?.user?.role || ctx?.session?.role;
	const roleBroker =
		session?.session?.brokerRole ||
		ctx?.session?.brokerRole ||
		session?.user?.role === Role.customer
			? session?.token || session?.session?.token
				? await ctx.database.session
						.findUnique({
							where: {
								token: session?.token || session?.session?.token,
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
				: undefined
			: undefined;

	const isBackoffice =
		role === Role.admin ||
		role === Role.manager ||
		role === Role.finance ||
		role === Role.counter;

	const isCustomer = role === Role.customer;

	const isProducer = roleBroker === Role.producer;

	async function logOut() {
		const cloneResponse = response.clone();

		const responseSignOut = await ctx.auth.api.signOut({
			headers: cloneResponse.headers,
			asResponse: true,
		});

		return new Response(
			JSON.stringify({
				code: 'INVALID_EMAIL_OR_PASSWORD',
				message: 'E-mail ou senha inválidos',
			}),
			{
				...responseSignOut,
				status: 401,
				statusText: 'Unauthorized',
			},
		);
	}

	console.log('XClientApp:', XClientApp);

	if (session) {
		if (isBackoffice) {
			if (XClientApp !== 'admin') {
				return await logOut();
			}
		}

		if (isCustomer) {
			if (isProducer || XClientApp !== 'customer') {
				return await logOut();
			}
		}

		if (isProducer) {
			if (XClientApp !== 'producer') {
				return await logOut();
			}
		}
	}

	if (setCookies.length) {
		const modifiedCookies = setCookies.map((cookieStr) => {
			let cookie = cookieStr;

			if (isBackoffice || isCustomer || isProducer) {
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

				if (isCustomer && !isProducer) {
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
			}

			return cookie;
		});

		response.headers.delete('set-cookie');

		if (ctx.req.url?.includes('/auth/sign-out')) {
			const cookies = [
				`__Secure-backoffice.${ctx.environment.NODE_ENV}.auth.session_token=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-${ctx.environment.NODE_ENV}.auth.session_data=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-${ctx.environment.NODE_ENV}.auth.dont_remember=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-customer.${ctx.environment.NODE_ENV}.auth.session_token=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-${ctx.environment.NODE_ENV}.auth.session_data=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-${ctx.environment.NODE_ENV}.auth.dont_remember=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-producer.${ctx.environment.NODE_ENV}.auth.session_token=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-${ctx.environment.NODE_ENV}.auth.session_data=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
				`__Secure-${ctx.environment.NODE_ENV}.auth.dont_remember=; Max-Age=0; Domain=localhost; Path=/; HttpOnly; Secure; SameSite=Lax`,
			];

			cookies.forEach((ctx) => {
				response.headers.append('set-cookie', ctx);
			});
		}

		modifiedCookies.forEach((ctx) => {
			response.headers.append('set-cookie', ctx);
		});
	}

	return response;
}

export { responseReplaceSession };
