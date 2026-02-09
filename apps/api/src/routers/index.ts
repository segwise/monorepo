import type { Server } from '@/@types/server.d';

import { registerRoutersAPI } from '@/routers/api';
import { registerRoutersServices } from '@/routers/services';

function registerRouters(server: Server) {
	registerRoutersServices(server);
	registerRoutersAPI(server);
}

export { registerRouters };
