import type { Server } from '@/@types/server.d';

import { registerRoutersServicesVehiclesManufacturers } from '@/routers/services/vehicles/manufacturer';
import { registerRoutersServicesVehiclesPlate } from '@/routers/services/vehicles/plate';

function registerRoutersServicesVehicles(server: Server) {
	const base = server.basePath('/vehicles');

	registerRoutersServicesVehiclesPlate(base);
	registerRoutersServicesVehiclesManufacturers(base);
}

export { registerRoutersServicesVehicles };
