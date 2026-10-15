import type { Server } from '@/@types/server';

function registerRoutersServicesQuotesByIdDelete(server: Server) {
	server.delete('/', async (ctx) => {
		try {
			const id = ctx.req.param('id');

			const brokerId = ctx.session.brokerId;

			await ctx.database.$transaction(async (transaction) => {
				const quote = await transaction.quote.delete({
					where: {
						id,
					},
					select: {
						brokerId: true,
					},
				});

				if (quote.brokerId !== brokerId) {
					throw new Error('Cotação não pode ser excluída pelo usuário');
				}
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
