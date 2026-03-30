import z from 'zod';
import type { Server } from '@/@types/server.d';
import { registerRoutersServicesQuotesByIdDelete } from '@/routers/services/quotes/[id]/delete';
import { registerRoutersServicesQuotesByIdPrint } from '@/routers/services/quotes/[id]/print';

function registerRoutersServicesQuotesById(server: Server) {
	const base = server.basePath(
		`/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesQuotesByIdPrint(base);
	registerRoutersServicesQuotesByIdDelete(base);
}

export { registerRoutersServicesQuotesById };
