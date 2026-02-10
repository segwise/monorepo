import type { Server } from '@/@types/server.d';

import { registerRoutersServicesProducersListiningSimple } from '@/routers/services/producers/listinig';

function registerRoutersServicesProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersServicesProducersListiningSimple(base);
}

export { registerRoutersServicesProducers };
