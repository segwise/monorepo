import type { Server } from '@/@types/server';
import { registerRoutersServicesMarketplaceAuth } from './auth';
import { registerRoutersServicesMarketplaceListining } from './listining';
import { registerRoutersServicesMarketplaceRegister } from './register';

function registerRoutersServicesMarketplace(server: Server) {
	const base = server.basePath('/marketplace');

	registerRoutersServicesMarketplaceAuth(base);
	registerRoutersServicesMarketplaceListining(base);
	registerRoutersServicesMarketplaceRegister(base);
}

export { registerRoutersServicesMarketplace };
