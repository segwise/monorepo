import type { Server } from '@/@types/server.d';

import { registerRoutersServicesProducersSimpleListining } from '@/routers/services/producers/listinig';
import { registerRoutersServicesProducersPublicLink } from '@/routers/services/producers/public-link';
import { registerRoutersServicesProducersPublicRegister } from '@/routers/services/producers/public-register';
import { registerRoutersServicesProducersRegister } from '@/routers/services/producers/register';

function registerRoutersServicesProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersServicesProducersSimpleListining(base);
	registerRoutersServicesProducersRegister(base);
	registerRoutersServicesProducersPublicRegister(base);
	registerRoutersServicesProducersPublicLink(base);
}

export { registerRoutersServicesProducers };
