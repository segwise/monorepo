import type { Server } from '@/@types/server';
import { registerRoutersAuth } from '@/routers/auth';

function registerRouters(server: Server) {
	registerRoutersAuth(server);
}

export { registerRouters };
