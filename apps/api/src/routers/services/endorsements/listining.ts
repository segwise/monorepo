import type { Server } from '@/@types/server';

function registerRoutersServicesEndorsementsListining(server: Server) {
	server.get('/', async (ctx) => {
		const id = ctx.req.param('id');

		const response = await ctx.database.endorsement.findMany({
			where: {
				safeId: id,
			},
			select: {
				id: true,
				type: true,
				effectivedAt: true,
				createdAt: true,
			},
		});

		return ctx.json(response, 200);
	});
}

export { registerRoutersServicesEndorsementsListining };
