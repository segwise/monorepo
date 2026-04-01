import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAnalyticsSafesCount } from './count';
import { registerRoutersServicesAnalyticsSafesStatus } from './status';

function registerRoutersServicesAnalyticsSafes(server: Server) {
	const base = server.basePath('/safes');

	registerRoutersServicesAnalyticsSafesStatus(base);
	registerRoutersServicesAnalyticsSafesCount(base);
}

export { registerRoutersServicesAnalyticsSafes };
