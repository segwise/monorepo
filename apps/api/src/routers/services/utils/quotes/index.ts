import type { Server } from '@/@types/server';
import { registerRoutersServicesUtilsQuotesRegister } from './register';

function registerRoutersServicesUtilsQuotes(server: Server) {
	const base = server.basePath('/quotes');

	registerRoutersServicesUtilsQuotesRegister(base);
}

export { registerRoutersServicesUtilsQuotes };
