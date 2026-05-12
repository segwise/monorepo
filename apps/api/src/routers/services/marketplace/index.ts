import type { Server } from '@/@types/server';
import { registerRoutersServicesMarketplaceAuth } from './auth';
import { registerRoutersServicesMarketplaceCities } from './cities';
import { registerRoutersServicesMarketplaceListining } from './listining';
import { registerRoutersServicesMarketplaceRegister } from './register';
import { registerRoutersServicesMarketplaceStates } from './states';

function registerRoutersServicesMarketplace(server: Server) {
	const base = server.basePath('/marketplace');

	registerRoutersServicesMarketplaceAuth(base);
	registerRoutersServicesMarketplaceListining(base);
	registerRoutersServicesMarketplaceStates(base);
	registerRoutersServicesMarketplaceCities(base);

	const myVehicles = base.basePath('/my-vehicles');

	registerRoutersServicesMarketplaceRegister(myVehicles);
}

export { registerRoutersServicesMarketplace };
