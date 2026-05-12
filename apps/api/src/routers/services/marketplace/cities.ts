import type { Server } from '@/@types/server';

function registerRoutersServicesMarketplaceCities(server: Server) {
	server.get('/cities', async (ctx) => {
		const state = ctx.req.query('state');

		if (!state) {
			return ctx.json(
				{
					message: 'Cidades não encontrada',
				},
				409,
			);
		}

		const cities = await ctx.database.marketplaceVehicle.groupBy({
			by: ['state', 'city'],
			where: {
				state: {
					search: state.replaceAll(' ', '&'),
				},
			},
			orderBy: {
				state: 'asc',
			},
		});

		const response = cities.map((response) => response.city.toLowerCase());

		return ctx.json(response, 200);
	});
}

export { registerRoutersServicesMarketplaceCities };
