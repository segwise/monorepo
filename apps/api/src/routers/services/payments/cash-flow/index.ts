import type { Server } from '@/@types/server';
import { registerRoutersServicesPaymentsCashFlowSimpleListining } from './simple';

function registerRoutersServicesPaymentsCashFlow(server: Server) {
	const base = server.basePath('/cash-flow');

	registerRoutersServicesPaymentsCashFlowSimpleListining(base);
}

export { registerRoutersServicesPaymentsCashFlow };
