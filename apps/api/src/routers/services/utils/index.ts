import type { Server } from '@/@types/server';

import { registerRoutersServicesUtilsAcceptInvitation } from './accept-invitation';
import { registerRoutersServicesUtilsProducers } from './producers';
import { registerRoutersServicesUtilsQuotes } from './quotes';

function registerRoutersServicesUtils(server: Server) {
	registerRoutersServicesUtilsAcceptInvitation(server);
	registerRoutersServicesUtilsQuotes(server);
	registerRoutersServicesUtilsProducers(server);
}

export { registerRoutersServicesUtils };
