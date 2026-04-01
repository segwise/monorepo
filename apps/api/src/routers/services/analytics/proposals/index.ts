import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAnalyticsProposalsCount } from './count';
import { registerRoutersServicesAnalyticsProposalsStatus } from './status';

function registerRoutersServicesAnalyticsProposals(server: Server) {
	const base = server.basePath('/proposals');

	registerRoutersServicesAnalyticsProposalsStatus(base);
	registerRoutersServicesAnalyticsProposalsCount(base);
}

export { registerRoutersServicesAnalyticsProposals };
