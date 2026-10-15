import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import type { Server } from '@/@types/server';
import { migrationById } from '@/functions/migrations/update-by-id';

function registerRoutersServicesWebhooksUpdaterSafeByID(server: Server) {
	server.put(
		'/updater-safe-by-id/:id',
		zValidator(
			'query',
			z.object({
				delete: z
					.literal(['true'])
					.transform((e) => e === 'true')
					.nullish(),
			}),
		),
		async (ctx) => {
			const id = ctx.req.param('id');
			const { delete: del } = ctx.req.valid('query');

			if (del === true) {
				await ctx.database.safe.delete({
					where: {
						externalId: id,
					},
				});
			}

			if (!del) {
				await migrationById(id);
			}

			return ctx.json(
				{
					ok: true,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesWebhooksUpdaterSafeByID };
