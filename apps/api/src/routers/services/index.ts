import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAuth } from '@/routers/services/auth';
import { registerRoutersServicesProducers } from '@/routers/services/producers';
import { registerRoutersServicesProfessions } from '@/routers/services/professions';
import { registerRoutersServicesQuotes } from '@/routers/services/quotes';
import { registerRoutersServicesVehicles } from '@/routers/services/vehicles';

function registerRoutersServices(server: Server) {
	const baseURL = server.basePath('/services');

	registerRoutersServicesAuth(baseURL);
	registerRoutersServicesProducers(baseURL);
	registerRoutersServicesProfessions(baseURL);
	registerRoutersServicesVehicles(baseURL);
	registerRoutersServicesQuotes(baseURL);
}

export { registerRoutersServices };
