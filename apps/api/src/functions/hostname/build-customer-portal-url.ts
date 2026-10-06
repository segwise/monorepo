import type { Environment } from '@/@types/environment';

// Portal da corretora (X-Client-App = customer). Em dev e em produção
// APPLICATION_URL é a raiz da aplicação; CUSTOMER_PORTAL_URL só é necessário se o
// portal da corretora ficar em outro endereço.
function buildCustomerPortalUrl(environment: Environment, pathname: string) {
	const url = new URL(
		environment.CUSTOMER_PORTAL_URL ?? environment.APPLICATION_URL,
	);

	url.pathname = pathname;

	return url.toJSON();
}

export { buildCustomerPortalUrl };
