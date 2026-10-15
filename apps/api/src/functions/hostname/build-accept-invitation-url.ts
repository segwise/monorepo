import type { Environment } from '@/@types/environment';
import { getMainDomain } from './get-main-domain';

function buildAcceptInvitationUrl(
	environment: Environment,
	invitationId: string,
) {
	const url = new URL(
		`http${environment.NODE_ENV !== 'development' ? 's' : ''}://${environment.NODE_ENV !== 'development' ? 'services.' : ''}${getMainDomain(environment.APPLICATION_URL)}${environment.NODE_ENV === 'development' ? `:${environment.PORT}` : ''}`,
	);

	url.pathname = '/accept-invitation';

	url.searchParams.set('token', invitationId);

	return url.toJSON();
}

export { buildAcceptInvitationUrl };
