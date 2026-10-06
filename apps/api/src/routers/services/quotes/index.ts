import type { Server } from '@/@types/server.d';
import { registerRoutersServicesQuotesById } from '@/routers/services/quotes/[id]';
import { registerRoutersServicesQuotesSimpleListining } from '@/routers/services/quotes/listinig';
import { registerRoutersServicesQuotesRegister } from '@/routers/services/quotes/register';
import { requireSession } from '@/server/middlewares/session';
import { registerRoutersServicesQuotesByPlate } from './[plate]';

function registerRoutersServicesQuotes(server: Server) {
	const base = server.basePath('/quotes');

	// Só a listagem (GET): o POST /simple é o pedido de cotação do app, sem login.
	base.get('/simple', requireSession);

	registerRoutersServicesQuotesById(base);
	registerRoutersServicesQuotesByPlate(base);
	registerRoutersServicesQuotesRegister(base);
	registerRoutersServicesQuotesSimpleListining(base);
}

export { registerRoutersServicesQuotes };
