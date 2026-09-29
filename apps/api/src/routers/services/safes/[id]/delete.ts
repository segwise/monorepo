import type { Server } from '@/@types/server';

function registerRoutersServicesSafesByIdDelete(server: Server) {
	server.delete('/', async (ctx) => {
		try {
			const id = ctx.req.param('id');

			const brokerId = ctx.session.brokerId;

			await ctx.database.$transaction(async (transaction) => {
				const safe = await transaction.safe.delete({
					where: {
						id,
					},
					select: {
						brokerId: true,
					},
				});

				if (safe.brokerId !== brokerId) {
					throw new Error('Proposta não pode ser excluída pelo usuário');
				}

				return safe;
			});

			return ctx.json(
				{
					message: 'Proposta excluída com sucesso',
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
