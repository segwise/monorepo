import type { Server } from '@/@types/server.d';
import { requireSession } from '@/server/middlewares/session';

import { registerRoutersServicesAnalyticsDashboard } from './dashboard';
import { registerRoutersServicesAnalyticsProposals } from './proposals';
import { registerRoutersServicesAnalyticsQuotes } from './quotes';

function registerRoutersServicesAnalytics(server: Server) {
	const base = server.basePath('/analytics');

	base.use(requireSession);

	registerRoutersServicesAnalyticsDashboard(base);
	registerRoutersServicesAnalyticsQuotes(base);
	registerRoutersServicesAnalyticsProposals(base);
}

export { registerRoutersServicesAnalytics };
