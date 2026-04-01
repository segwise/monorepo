import type { Server } from '@/@types/server';

function registerRoutersServicesSafesByIdDelete(server: Server) {
	server.delete('/', async (ctx) => {
		try {
			const id = ctx.req.param('id');

			await ctx.database.safe.delete({
				where: {
					id,
				},
			});

			return ctx.json(
				{
					message: 'Seguro excluído com sucessos',
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

export { registerRoutersServicesSafesByIdDelete };
