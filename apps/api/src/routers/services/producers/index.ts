import type { Server } from '@/@types/server.d';

import { registerRoutersProducersListiningSimple } from '@/routers/services/producers/listinig';

function registerRoutersProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersProducersListiningSimple(base);
}

export { registerRoutersProducers };
