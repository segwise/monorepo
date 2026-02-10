import type { Server } from '@/@types/server.d';

import { registerRoutersVehiclesManufacturers } from '@/routers/services/vehicles/manufacturer';
import { registerRoutersVehiclesPlate } from '@/routers/services/vehicles/plate';

function registerRoutersVehicles(server: Server) {
	const base = server.basePath('/vehicles');

	registerRoutersVehiclesPlate(base);
	registerRoutersVehiclesManufacturers(base);
}

export { registerRoutersVehicles };
