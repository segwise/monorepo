import type { Server } from '@/@types/server.d';

import { registerRoutersServicesQuotesById } from '@/routers/services/quotes/[id]';
import { registerRoutersServicesQuotesSimpleListining } from '@/routers/services/quotes/listinig';
import { registerRoutersServicesQuotesRegister } from '@/routers/services/quotes/register';

function registerRoutersServicesQuotes(server: Server) {
	const base = server.basePath('/quotes');

	registerRoutersServicesQuotesById(base);
	registerRoutersServicesQuotesRegister(base);
	registerRoutersServicesQuotesSimpleListining(base);
}

export { registerRoutersServicesQuotes };
