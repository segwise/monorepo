import type { Server } from '@/@types/server.d';

import { registerRoutersServicesQuotesRegister } from '@/routers/services/quotes/register';

function registerRoutersServicesQuotes(server: Server) {
	const base = server.basePath('/quotes');

	registerRoutersServicesQuotesRegister(base);
}

export { registerRoutersServicesQuotes };
