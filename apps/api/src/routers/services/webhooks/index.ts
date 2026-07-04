import type { Server } from '@/@types/server';
import { registerRoutersServicesWebhooksUpdaterSafeByID } from './updater-safe-by-id';

function registerRoutersServicesWebhooks(server: Server) {
	const base = server.basePath('/webhooks');

	registerRoutersServicesWebhooksUpdaterSafeByID(base);
}

export { registerRoutersServicesWebhooks };
