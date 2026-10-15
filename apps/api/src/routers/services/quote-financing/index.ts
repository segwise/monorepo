import type { Server } from '@/@types/server';
import { registerRoutersServicesQuoteFinancingRegister } from './register';

function registerRoutersServicesQuoteFinancing(server: Server) {
	const base = server.basePath('/quote-financing');

	registerRoutersServicesQuoteFinancingRegister(base);
}

export { registerRoutersServicesQuoteFinancing };
