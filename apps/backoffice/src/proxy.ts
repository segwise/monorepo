import { cookiesAuthRelevant } from '@segwise/core/utils';
import { getSessionCookie } from 'better-auth/cookies';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { clientIpHeaders } from './libraries/api-url';
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

// SHA do commit da imagem (ENV APP_VERSION, na última camada do Dockerfile), lido em tempo de execução.
// Não fica no `headers()` do next.config: aquele valor entra no build, e o build do Next passaria a mudar
// a cada commit (invalidando o cache do Docker e fazendo o servidor baixar o backoffice de novo mesmo
// quando só a api mudou). O CD confere este header para saber que a versão nova está no ar.
function withVersion(response: NextResponse) {
	response.headers.set('X-App-Version', process.env.APP_VERSION ?? 'unknown');

	return response;
}

const getSessionCached = unstable_cache(
	// `ipHeaders` (IP do usuário) também entra na chave do cache; o cookie já é único por sessão.
	async (cookie: string, ipHeaders: Record<string, string>) => {
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
					...ipHeaders,
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

		return withVersion(NextResponse.rewrite(redirectTo));
	}

	const session = await getSessionCached(
		// @ts-expect-error
		cookiesAuthRelevant(ACCESS, request.cookies.toString()),
		clientIpHeaders(request.headers),
	);

	if (session && pathname === '/') {
		return withVersion(
			NextResponse.redirect(new URL('/dashboard', request.url)),
		);
	}

	const isPublicRoute = PUBLIC_ROUTES.some((route) =>
		route.endsWith(':path*')
			? pathname.startsWith(`/${ACCESS}${route.replace('/:path*', '')}`)
			: pathname === route,
	);

	if (session && isPublicRoute) {
		return withVersion(
			NextResponse.redirect(new URL('/dashboard', request.url)),
		);
	}

	if (!session && isPublicRoute) {
		const redirectTo = new URL(
			ACCESS ? `/${ACCESS}${pathname}` : `/${pathname}`,
			request.url,
		);

		return withVersion(NextResponse.rewrite(redirectTo));
	}

	if (!session && !isPublicRoute) {
		if (pathname === `/${ACCESS}/sign-in`) {
			return withVersion(NextResponse.next());
		}

		const redirectTo = new URL(`/sign-in`, request.url);

		if (pathname !== '/') {
			redirectTo.searchParams.set('callbackUrl', pathname);
		}

		return withVersion(NextResponse.redirect(redirectTo));
	}

	const redirectTo = new URL(
		ACCESS ? `/${ACCESS}${pathname}` : `/${pathname}`,
		request.url,
	);

	return withVersion(NextResponse.rewrite(redirectTo));
}

// Fora do proxy: rotas internas do Next e os arquivos de `public/` (hoje só `public/images/`). Sem isso,
// `/images/logo.png` ia para o /sign-in sem sessão e era reescrito para `/admin/images/...` (404) com
// sessão, e o otimizador do next/image não conseguia ler essas imagens. Nova pasta em `public/`? Inclua
// aqui.
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images/).*)'],
};

export { proxy };
