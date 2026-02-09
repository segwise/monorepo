import type { Server } from '@/@types/server.d';
import { auth } from '@/auth';

function registerRoutersAuth(server: Server) {
	server.on(
		['POST', 'GET'],
		'/auth/*',
		async (ctx) => await auth.handler(ctx.req.raw),
	);
}

export { registerRoutersAuth };
