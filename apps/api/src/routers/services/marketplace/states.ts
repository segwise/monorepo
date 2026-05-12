import type { Server } from '@/@types/server';

function registerRoutersServicesMarketplaceStates(server: Server) {
	server.get('/states', async (ctx) => {
		const states = await ctx.database.marketplaceVehicle.groupBy({
			by: ['state'],
			orderBy: {
				state: 'asc',
			},
		});

		const response = states.map((response) => response.state.toLowerCase());

		return ctx.json(response, 200);
	});
}

export { registerRoutersServicesMarketplaceStates };
