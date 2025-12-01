import type { Server } from '@/@types/server';
import { registerRoutersAuth } from '@/routers/services/auth';

function registerRoutersServices(server: Server) {
	const baseURL = server.basePath('/services');

	registerRoutersAuth(baseURL);
}

export { registerRoutersServices };
