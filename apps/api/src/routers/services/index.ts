import type { Server } from '@/@types/server';
import { registerRoutersAuth } from '@/routers/services/auth';

function registerRoutersServices(server: Server) {
	registerRoutersAuth(server);
}

export { registerRoutersServices };
