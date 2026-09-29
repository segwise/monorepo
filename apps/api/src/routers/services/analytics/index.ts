import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAnalyticsDashboard } from './dashboard';
import { registerRoutersServicesAnalyticsProposals } from './proposals';
import { registerRoutersServicesAnalyticsQuotes } from './quotes';

function registerRoutersServicesAnalytics(server: Server) {
	const base = server.basePath('/analytics');

	registerRoutersServicesAnalyticsDashboard(base);
	registerRoutersServicesAnalyticsQuotes(base);
	registerRoutersServicesAnalyticsProposals(base);
}

export { registerRoutersServicesAnalytics };
