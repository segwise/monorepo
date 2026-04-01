import type { Server } from '@/@types/server';
import { registerRoutersServicesAnalyticsQuotes } from './quotes';
import { registerRoutersServicesAnalyticsSafes } from './safes';

function registerRoutersServicesAnalytics(server: Server) {
	const base = server.basePath('/analytics');

	registerRoutersServicesAnalyticsQuotes(base);
	registerRoutersServicesAnalyticsSafes(base);
}

export { registerRoutersServicesAnalytics };
