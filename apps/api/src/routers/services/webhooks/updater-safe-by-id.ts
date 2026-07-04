import type { Server } from '@/@types/server';

function registerRoutersServicesWebhooksUpdaterSafeByID(server: Server) {
	server.put('/updater-safe-by-id/:id', async (ctx) => {
		const id = ctx.req.param('id');

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});
}

export { registerRoutersServicesWebhooksUpdaterSafeByID };
