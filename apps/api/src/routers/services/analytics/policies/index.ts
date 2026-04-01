import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAnalyticsPoliciesCount } from './count';
import { registerRoutersServicesAnalyticsPoliciesStatus } from './status';

function registerRoutersServicesAnalyticsPolicies(server: Server) {
	const base = server.basePath('/policies');

	registerRoutersServicesAnalyticsPoliciesStatus(base);
	registerRoutersServicesAnalyticsPoliciesCount(base);
}

export { registerRoutersServicesAnalyticsPolicies };
