import { cookiesAuthRelevant } from '@segwise/core/utils';
import { getSessionCookie } from 'better-auth/cookies';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { auth, getCookiePrefix } from './libraries/auth';

const ACCESS = process.env.NEXT_PUBLIC_ROLE_SYSTEM;

const PUBLIC_ROUTES = [
	'/sign-in',
	'/forgot-password',
	'/reset-password',
	'/accept-invitation',
];

// Diferente de PUBLIC_ROUTES: essas rotas são públicas sempre, mesmo com
// sessão ativa — não são telas de "pré-login" (como /sign-in), então não
// fazem sentido redirecionar para /dashboard quando já logado. Prefixo
// (não exato) porque carrega o slug da corretora, ex.:
// /register/minha-corretora — link de auto-cadastro público de produtor.
const ALWAYS_PUBLIC_ROUTE_PREFIXES = ['/register/'];

const COOKIE_PREFIX = getCookiePrefix();

const getSessionCached = unstable_cache(
	async (cookie: string) => {
		const sessionCookie = getSessionCookie(
			new Headers({
				cookie,
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
				},
			},
		});

		return session.data;
	},
	['session-proxy', COOKIE_PREFIX],
	{
		tags: ['session-proxy', COOKIE_PREFIX],
		revalidate: 60 * 30,
	},
);

async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const isAlwaysPublicRoute = ALWAYS_PUBLIC_ROUTE_PREFIXES.some((prefix) =>
		pathname.startsWith(prefix),
	);

	if (isAlwaysPublicRoute) {
		const redirectTo = new URL(
			ACCESS ? `/${ACCESS}${pathname}` : `/${pathname}`,
			request.url,
		);

		return NextResponse.rewrite(redirectTo);
	}

	const session = await getSessionCached(
		// @ts-expect-error
		cookiesAuthRelevant(ACCESS, request.cookies.toString()),
	);

	if (session && pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	const isPublicRoute = PUBLIC_ROUTES.some((route) =>
		route.endsWith(':path*')
			? pathname.startsWith(`/${ACCESS}${route.replace('/:path*', '')}`)
			: pathname === route,
	);

	if (session && isPublicRoute) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	if (!session && isPublicRoute) {
		const redirectTo = new URL(
			ACCESS ? `/${ACCESS}${pathname}` : `/${pathname}`,
			request.url,
		);

		return NextResponse.rewrite(redirectTo);
	}

	if (!session && !isPublicRoute) {
		if (pathname === `/${ACCESS}/sign-in`) {
			return NextResponse.next();
		}

		const redirectTo = new URL(`/sign-in`, request.url);

		if (pathname !== '/') {
			redirectTo.searchParams.set('callbackUrl', pathname);
		}

		return NextResponse.redirect(redirectTo);
	}

	const redirectTo = new URL(
		ACCESS ? `/${ACCESS}${pathname}` : `/${pathname}`,
		request.url,
	);

	return NextResponse.rewrite(redirectTo);
}

// Fora do proxy: rotas internas do Next e os arquivos de `public/` (hoje só `public/images/`). Sem isso,
// `/images/logo.png` ia para o /sign-in sem sessão e era reescrito para `/admin/images/...` (404) com
// sessão, e o otimizador do next/image não conseguia ler essas imagens. Nova pasta em `public/`? Inclua
// aqui.
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images/).*)'],
};

export { proxy };
