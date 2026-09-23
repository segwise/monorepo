import type { Environment } from '@/@types/environment';
import { getMainDomain } from './get-main-domain';

// Porta local do portal do produtor em dev, já usada pelo redirect de
// aceitar convite (ver utils/accept-invitation.ts) — reaproveitada aqui
// para manter os dois pontos apontando para o mesmo lugar.
const PRODUCER_DEV_PORT = 3000;

function buildProducerPortalUrl(environment: Environment, pathname: string) {
	const url = new URL(
		`http${environment.NODE_ENV !== 'development' ? 's' : ''}://${environment.NODE_ENV !== 'development' ? 'producer.' : ''}${getMainDomain(environment.APPLICATION_URL)}${environment.NODE_ENV === 'development' ? `:${PRODUCER_DEV_PORT}` : ''}`,
	);

	url.pathname = pathname;

	return url.toJSON();
}

export { buildProducerPortalUrl };
