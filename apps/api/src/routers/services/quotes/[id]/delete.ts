import type { Server } from '@/@types/server';

function registerRoutersServicesQuotesByIdDelete(server: Server) {
	server.delete('/', async (ctx) => {
		try {
			const id = ctx.req.param('id');

			await ctx.database.quote.delete({
				where: {
					id,
				},
			});

			return ctx.json(
				{
					message: 'Cotação excluída com sucessos',
				},
				200,
			);
		} catch (error) {
			let message = 'Ocorreu algum erro ao excluir';

			if (error instanceof Error) {
				message = error.message;
			}

			return ctx.json(
				{
					message,
				},
				500,
			);
		}
	});
}

export { registerRoutersServicesQuotesByIdDelete };
