import { getCookieCache } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = new Set([
	'/sign-in',
	'/forgot-password',
	'/reset-password',
]);

async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const session = await getCookieCache(request);

	if (session && PUBLIC_ROUTES.has(pathname)) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	if (!session && !PUBLIC_ROUTES.has(pathname)) {
		return NextResponse.redirect(new URL('/sign-in', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

export { proxy };
