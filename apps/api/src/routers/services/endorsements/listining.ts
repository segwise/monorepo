import type { Server } from '@/@types/server';

function registerRoutersServicesEndorsementsListining(server: Server) {
	server.get('/', async (ctx) => {
		const id = ctx.req.param('id');

		return ctx.json({}, 200);
	});
}

export { registerRoutersServicesEndorsementsListining };
