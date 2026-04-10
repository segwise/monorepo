import type { Server } from '@/@types/server';

import { registerRoutersServicesUtilsAcceptInvitation } from './accept-invitation';

function registerRoutersServicesUtils(server: Server) {
	registerRoutersServicesUtilsAcceptInvitation(server);
}

export { registerRoutersServicesUtils };
