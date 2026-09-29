import type { Server } from '@/@types/server';
import { StatusMember } from '@/generated/prisma/enums';

// Exclui produtor/parceiro. Se já existe cotação/proposta vinculada a ele
// (FK Restrict + histórico), suspende em vez de apagar.
function registerRoutersServicesProducersByIdDelete(server: Server) {
	server.delete('/', async (ctx) => {
		try {
			const id = ctx.req.param('id') as string;
			const brokerId = ctx.session.brokerId;

			if (!brokerId) {
				throw new Error('Nenhuma corretora vinculada');
			}

			const member = await ctx.database.member.findUnique({
				where: { brokerId_userId: { brokerId, userId: id } },
				select: { id: true },
			});

			if (!member) {
				throw new Error('Cadastro não encontrado');
			}

			const [quotes, safes] = await ctx.database.$transaction([
				ctx.database.quote.count({ where: { producerId: id, brokerId } }),
				ctx.database.safe.count({ where: { producerId: id, brokerId } }),
			]);

			if (quotes + safes > 0) {
				await ctx.database.member.update({
					where: { id: member.id },
					data: { status: StatusMember.suspended },
				});

				return ctx.json(
					{
						action: 'suspended' as const,
						message: 'Possui registros vinculados, cadastro suspenso',
					},
					200,
				);
			}

			await ctx.database.member.delete({ where: { id: member.id } });

			const otherMembers = await ctx.database.member.count({
				where: { userId: id },
			});

			if (!otherMembers) {
				await ctx.database.user.delete({ where: { id } }).catch(() => {});
			}

			return ctx.json(
				{
					action: 'deleted' as const,
					message: 'Cadastro excluído com sucesso',
				},
				200,
			);
		} catch (error) {
			let message = 'Falha ao excluir cadastro';

			if (error instanceof Error) {
				message = error.message;
			}

			return ctx.json({ message }, 500);
		}
	});
}

export { registerRoutersServicesProducersByIdDelete };
