import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAnalyticsDashboard } from './dashboard';
import { registerRoutersServicesAnalyticsPolicies } from './policies';
import { registerRoutersServicesAnalyticsProposals } from './proposals';
import { registerRoutersServicesAnalyticsQuotes } from './quotes';

function registerRoutersServicesAnalytics(server: Server) {
	const base = server.basePath('/analytics');

	registerRoutersServicesAnalyticsDashboard(base);
	registerRoutersServicesAnalyticsQuotes(base);
	registerRoutersServicesAnalyticsPolicies(base);
	registerRoutersServicesAnalyticsProposals(base);
}

export { registerRoutersServicesAnalytics };
