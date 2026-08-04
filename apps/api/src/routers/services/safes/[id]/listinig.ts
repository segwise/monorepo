import type { Server } from '@/@types/server';

function registerRoutersServicesSafesByIdListining(server: Server) {
	server.get('/', async (ctx) => {
		return ctx.json({}, 200);
	});
}

export { registerRoutersServicesSafesByIdListining };
