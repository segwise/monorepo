import type { Server } from '@/@types/server.d';
import { registerRoutersServices } from '@/routers/services';
import { registerRoutersRedirects } from './redirects';

function registerRouters(server: Server) {
	registerRoutersServices(server);

	registerRoutersRedirects(server);
}

export { registerRouters };
