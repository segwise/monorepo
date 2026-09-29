import type { Server } from '@/@types/server.d';

import { registerRoutersServicesProducersById } from '@/routers/services/producers/[id]';
import { registerRoutersServicesProducersSimpleListining } from '@/routers/services/producers/listinig';
import { registerRoutersServicesProducersPending } from '@/routers/services/producers/pending';
import { registerRoutersServicesProducersPendingDelete } from '@/routers/services/producers/pending-delete';
import { registerRoutersServicesProducersPendingRenew } from '@/routers/services/producers/pending-renew';
import { registerRoutersServicesProducersPublicLink } from '@/routers/services/producers/public-link';
import { registerRoutersServicesProducersPublicRegister } from '@/routers/services/producers/public-register';
import { registerRoutersServicesProducersRegister } from '@/routers/services/producers/register';
import { registerRoutersServicesProducersRegisterInternal } from '@/routers/services/producers/register-internal';

function registerRoutersServicesProducers(server: Server) {
	const base = server.basePath('/producers');

	registerRoutersServicesProducersById(base);
	registerRoutersServicesProducersSimpleListining(base);
	registerRoutersServicesProducersRegister(base);
	registerRoutersServicesProducersRegisterInternal(base);
	registerRoutersServicesProducersPublicRegister(base);
	registerRoutersServicesProducersPublicLink(base);
	registerRoutersServicesProducersPending(base);
	registerRoutersServicesProducersPendingDelete(base);
	registerRoutersServicesProducersPendingRenew(base);
}

export { registerRoutersServicesProducers };
