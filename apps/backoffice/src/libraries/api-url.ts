// URL da API para cada lado do Next:
//  - navegador: `/api` no próprio domínio do site (absoluta, porque há código que faz `new URL(base + ...)`).
//    O Next repassa para a api (rewrite em next.config.ts). Mesma origem: sem CORS e sem OPTIONS;
//  - servidor (SSR, proxy, server actions): a interna, pela rede `api-web` do compose
//    (API_INTERNAL_URL=http://segwise-api:3000/services). Sem sair para a internet nem ir ao Cloudflare e voltar:
//    menos de 1 ms em vez de dezenas. Sem API_INTERNAL_URL (desenvolvimento local) usa a pública.
// O módulo é avaliado separadamente nos bundles do servidor e do navegador; no navegador
// `API_INTERNAL_URL` nem existe (só variáveis NEXT_PUBLIC_* chegam ao cliente).
const apiBaseURL =
	typeof window === 'undefined'
		? process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL
		: `${window.location.origin}/api`;

// IP real do usuário para as chamadas que o servidor do Next faz em nome dele. Pela rede interna não há
// Cloudflare nem Traefik acrescentando esses headers, e sem IP o rate limit do better-auth junta todos os
// usuários num único balde. O valor vem do Cloudflare (cf-connecting-ip), que o define e sobrescreve.
function clientIpHeaders(headers: Headers): Record<string, string> {
	const ip =
		headers.get('cf-connecting-ip') ??
		headers.get('x-forwarded-for')?.split(',')[0]?.trim();

	return ip ? { 'x-forwarded-for': ip } : {};
}

export { apiBaseURL, clientIpHeaders };
