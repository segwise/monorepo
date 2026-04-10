import type { Server } from '@/@types/server.d';

import { registerRoutersServicesProducersSimpleListining } from '@/routers/services/producers/listinig';
import { registerRoutersServicesProducersRegister } from '@/routers/services/producers/register';

function registerRoutersServicesProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersServicesProducersSimpleListining(base);
	registerRoutersServicesProducersRegister(base);
}

export { registerRoutersServicesProducers };
