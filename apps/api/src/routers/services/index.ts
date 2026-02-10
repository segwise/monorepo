import type { Server } from '@/@types/server.d';

import { registerRoutersAuth } from '@/routers/services/auth';
import { registerRoutersProducers } from '@/routers/services/producers';
import { registerRoutersProfessions } from '@/routers/services/professions';
import { registerRoutersVehicles } from '@/routers/services/vehicles';

function registerRoutersServices(server: Server) {
	const baseURL = server.basePath('/services');

	registerRoutersAuth(baseURL);
	registerRoutersProducers(baseURL);
	registerRoutersProfessions(baseURL);
	registerRoutersVehicles(baseURL);
}

export { registerRoutersServices };
