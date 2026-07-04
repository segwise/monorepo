import type { Server } from '@/@types/server';
import { migrationById } from '@/functions/migrations/update-by-id';

function registerRoutersServicesWebhooksUpdaterSafeByID(server: Server) {
	server.put('/updater-safe-by-id/:id', async (ctx) => {
		const id = ctx.req.param('id');

		await migrationById(id);

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});
}

export { registerRoutersServicesWebhooksUpdaterSafeByID };
