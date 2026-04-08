import type { Server } from '@/@types/server.d';

import { registerRoutersServicesProducersSimpleListining } from '@/routers/services/producers/listinig';
import { registerRoutersServicesProducersReferral } from '@/routers/services/producers/referral';
import { registerRoutersServicesProducersRegister } from '@/routers/services/producers/register';

function registerRoutersServicesProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersServicesProducersSimpleListining(base);
	registerRoutersServicesProducersReferral(base);
	registerRoutersServicesProducersRegister(base);
}

export { registerRoutersServicesProducers };
