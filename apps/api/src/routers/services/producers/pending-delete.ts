import { StatusInvitation } from '@segwise/database/enums';
import type { Server } from '@/@types/server';

function registerRoutersServicesProducersPendingDelete(server: Server) {
	server.delete('/pending/:id', async (ctx) => {
		try {
			const id = ctx.req.param('id');

			const brokerId = ctx.session.brokerId;

			if (!brokerId) {
				throw new Error('Nenhuma corretora vinculada');
			}

			const { count } = await ctx.database.invitation.deleteMany({
				where: {
					id,
					brokerId,
					status: StatusInvitation.pending,
				},
			});

			if (!count) {
				throw new Error('Convite não encontrado');
			}

			return ctx.json({ message: 'Convite excluído com sucesso' }, 200);
		} catch (error) {
			let message = 'Falha ao excluir convite';

			if (error instanceof Error) {
				message = error.message;
			}

			return ctx.json({ message }, 500);
		}
	});
}

export { registerRoutersServicesProducersPendingDelete };
