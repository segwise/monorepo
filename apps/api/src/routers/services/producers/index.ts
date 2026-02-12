import type { Server } from '@/@types/server.d';

import { registerRoutersServicesProducersSimpleListining } from '@/routers/services/producers/listinig';

function registerRoutersServicesProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersServicesProducersSimpleListining(base);
}

export { registerRoutersServicesProducers };
