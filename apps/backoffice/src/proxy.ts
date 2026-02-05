import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/sign-in', '/forgot-password', '/reset-password'];

function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const session = getSessionCookie(request.headers, {
		cookiePrefix: 'auth',
	});

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
		redirectTo.searchParams.set('callbackUrl', pathname);

		return NextResponse.redirect(redirectTo);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};

export { proxy };
