// Chave = X-Client-App / NEXT_PUBLIC_ROLE_SYSTEM; valor = prefixo dos cookies daquele app. O painel
// interno roda com `admin`, mas os cookies dele usam o prefixo `backoffice` (a api grava assim: ver
// apps/api/src/functions/response/replace-session.ts). Sem `admin` aqui, o proxy do backoffice e o
// middleware de sessão da api descartavam o cookie e o admin nunca ficava logado.
const appPrefixes = {
	admin: ['backoffice'],
	backoffice: ['backoffice'],
	customer: ['customer'],
	producer: ['producer'],
	app: ['app'],
};

const filterCookies = (
	relevantPrefixes: Array<string>,
	cookieHeader: string,
) => {
	if (!cookieHeader) {
		return null;
	}

	const filtered = cookieHeader
		.split(';')
		.map((c) => c.trim())
		.filter((c) => {
			const isSessionCookie = [
				'backoffice',
				'customer',
				'producer',
				'app',
			].some((prefix) => c.includes(`${prefix}.`));
			if (!isSessionCookie) {
				return true;
			}

			return relevantPrefixes.some((prefix) => c.includes(`${prefix}.`));
		})
		.join('; ');

	return filtered || null;
};

function cookiesAuthRelevant(value: keyof typeof appPrefixes, cookies: string) {
	const relevantPrefixes = appPrefixes[value] ?? [];

	const newCookies = filterCookies(relevantPrefixes, cookies);

	return newCookies;
}

export { cookiesAuthRelevant };
