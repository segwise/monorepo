import type { Server } from '@/@types/server';
import { registerRoutersServicesUtilsProducersReferral } from './referral';

function registerRoutersServicesUtilsProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersServicesUtilsProducersReferral(base);
}

export { registerRoutersServicesUtilsProducers };
