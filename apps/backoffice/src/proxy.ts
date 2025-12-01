import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const PUBLIC_ROUTES = new Set([
	'/sign-in',
	'/forgot-password',
	'/reset-password',
]);

async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const { data: session } = await auth.getSession({
		fetchOptions: {
			headers: request.headers,
		},
	});

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
