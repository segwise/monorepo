import type { Server } from '@/@types/server';
import { registerRoutersServicesPaymentsCashFlow } from './cash-flow';

function registerRoutersServicesPayments(server: Server) {
	const base = server.basePath('/payments');

	registerRoutersServicesPaymentsCashFlow(base);
}

export { registerRoutersServicesPayments };
