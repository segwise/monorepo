import { unstable_cache } from 'next/cache';

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from './libraries/auth';

const PUBLIC_ROUTES = ['/sign-in', '/forgot-password', '/reset-password'];

const getSessionCached = unstable_cache(
	async (cookieHeader: string | null) => {
		const session = await auth.getSession({
			fetchOptions: {
				headers: cookieHeader ? { cookie: cookieHeader } : {},
			},
		});

		return session.data;
	},
	['session-proxy'],
	{
		tags: ['session-proxy'],
		revalidate: 60 * 30,
	},
);

async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const session = await getSessionCached(request.headers.get('cookie'));

	if (session && pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	const isPublicRoute = PUBLIC_ROUTES.some((route) =>
		route.endsWith(':path*')
			? pathname.startsWith(route.replace('/:path*', ''))
			: pathname === route,
	);

	if (session && isPublicRoute) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	if (!session && !isPublicRoute) {
		const redirectTo = new URL('/sign-in', request.url);

		if (pathname !== '/') {
			redirectTo.searchParams.set('callbackUrl', pathname);
		}

		return NextResponse.redirect(redirectTo);
	}

	if (session) {
		let startPathname = '/admin';

		if (session.user.role === 'producer') {
			startPathname = `/${session.user.role}`;
		}

		return NextResponse.rewrite(
			new URL(`${startPathname}${request.nextUrl.pathname}`, request.url),
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};

export { proxy };
