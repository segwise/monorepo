import type { Server } from '@/@types/server.d';

import { registerRoutersServicesAnalyticsQuotesCount } from './count';
import { registerRoutersServicesAnalyticsQuotesStatus } from './status';

function registerRoutersServicesAnalyticsQuotes(server: Server) {
	const base = server.basePath('/quotes');

	registerRoutersServicesAnalyticsQuotesStatus(base);
	registerRoutersServicesAnalyticsQuotesCount(base);
}

export { registerRoutersServicesAnalyticsQuotes };
