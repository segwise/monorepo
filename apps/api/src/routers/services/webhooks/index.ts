import type { Server } from '@/@types/server';

function registerRoutersServicesWebhooks(server: Server) {
	const base = server.basePath('/webhooks');
}

export { registerRoutersServicesWebhooks };
