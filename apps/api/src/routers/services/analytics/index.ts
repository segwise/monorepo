import type { Server } from '@/@types/server';
import { registerRoutersServicesAnalyticsQuotes } from './quotes';

function registerRoutersServicesAnalytics(server: Server) {
	const base = server.basePath('/analytics');

	registerRoutersServicesAnalyticsQuotes(base);
}

export { registerRoutersServicesAnalytics };
