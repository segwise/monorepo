import { getSessionCookie } from 'better-auth/cookies';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { auth, getCookiePrefix } from './libraries/auth';

const PUBLIC_ROUTES = ['/sign-in', '/forgot-password', '/reset-password'];

const COOKIE_PREFIX = getCookiePrefix();

const getSessionCached = unstable_cache(
	async (headers: Headers) => {
		const sessionCookie = getSessionCookie(new Headers(headers), {
			cookiePrefix: COOKIE_PREFIX,
		});

		if (!sessionCookie) {
			return null;
		}

		const cookieHeader = headers.get('cookie');

		const session = await auth.getSession({
			fetchOptions: {
				headers: cookieHeader ? { cookie: cookieHeader } : {},
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

async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const session = await getSessionCached(request.headers);

	if (session && pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	const isPublicRoute = PUBLIC_ROUTES.some((route) =>
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
