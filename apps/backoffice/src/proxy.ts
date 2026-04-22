import { getSessionCookie } from 'better-auth/cookies';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { auth, getCookiePrefix } from './libraries/auth';

const PUBLIC_ROUTES = [
	'/sign-in',
	'/forgot-password',
	'/reset-password',
	'/accept-invitation',
];

const SHARED_ROUTES = ['/referral/:code*', '/application'];

const COOKIE_PREFIX = getCookiePrefix();

const getSessionCached = unstable_cache(
	async (cookie: string) => {
		const sessionCookie = getSessionCookie(
			new Headers({
				cookie,
				'X-Client-App': process.env.NEXT_PUBLIC_ROLE_SYSTEM as string,
			}),
			{
				cookiePrefix: COOKIE_PREFIX,
			},
		);

		if (!sessionCookie) {
			return null;
		}

		const session = await auth.getSession({
			fetchOptions: {
				headers: {
					cookie,
					'X-Client-App': process.env.NEXT_PUBLIC_ROLE_SYSTEM as string,
				},
			},
		});

		return session.data;
	},
	['session-proxy', COOKIE_PREFIX],
	{
		tags: [`session-proxy-${COOKIE_PREFIX}`],
		revalidate: 60 * 30,
	},
);

function extractIp(headers: Headers, fallback: string): string {
	return (
		headers.get('cf-connecting-ip') ??
		headers.get('x-real-ip') ??
		headers.get('x-forwarded-for')?.split(',')[0].trim() ??
		fallback
	);
}

async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const isSharedRoute = SHARED_ROUTES.some((route) =>
		route.endsWith(':path*') || route.endsWith(':code*')
			? pathname.startsWith(route.replace('/:path*', '').replace('/:code*', ''))
			: pathname === route,
	);

	if (isSharedRoute) {
		const requestHeaders = new Headers(request.headers);

		const ip = extractIp(request.headers, 'unknown');

		requestHeaders.set('cf-connecting-ip', ip);
		requestHeaders.set('x-real-ip', ip);
		requestHeaders.set('x-forwarded-for', ip);

		return NextResponse.next({
			request: { headers: requestHeaders },
		});
	}

	const session = await getSessionCached(request.cookies.toString());

	if (session && pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	const isPublicRoute = [...PUBLIC_ROUTES, ...SHARED_ROUTES].some((route) =>
		route.endsWith(':path*')
			? pathname.startsWith(
					`/${process.env.NEXT_PUBLIC_ROLE_SYSTEM}${route.replace('/:path*', '')}`,
				)
			: pathname === route,
	);

	if (session && isPublicRoute) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	if (!session && isPublicRoute) {
		const redirectTo = new URL(
			`/${process.env.NEXT_PUBLIC_ROLE_SYSTEM}${pathname}`,
			request.url,
		);

		return NextResponse.rewrite(redirectTo);
	}

	if (!session && !isPublicRoute) {
		if (pathname === `/${process.env.NEXT_PUBLIC_ROLE_SYSTEM}/sign-in`) {
			return NextResponse.next();
		}

		const redirectTo = new URL(`/sign-in`, request.url);

		if (pathname !== '/') {
			redirectTo.searchParams.set('callbackUrl', pathname);
		}

		return NextResponse.redirect(redirectTo);
	}

	const redirectTo = new URL(
		`/${process.env.NEXT_PUBLIC_ROLE_SYSTEM}${pathname}`,
		request.url,
	);

	return NextResponse.rewrite(redirectTo);
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export { proxy };
