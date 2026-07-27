import type { Server } from '@/@types/server.d';

import { registerRoutersServices } from '@/routers/services';

function registerRouters(server: Server) {
	registerRoutersServices(server);
}

export { registerRouters };
