import z from 'zod';

import type { Server } from '@/@types/server.d';

import { registerRoutersServicesQuotesByIdDelete } from '@/routers/services/quotes/[id]/delete';

function registerRoutersServicesQuotesById(server: Server) {
	const base = server.basePath(`/:id{${z.regexes.uuid7.source}}`);

	registerRoutersServicesQuotesByIdDelete(base);
}

export { registerRoutersServicesQuotesById };
