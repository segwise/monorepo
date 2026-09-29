import { zValidator } from '@hono/zod-validator';
import { SchemaProducerInternalUpdate } from '@segwise/core';
import type { Server } from '@/@types/server';

// Edição de PRODUTOR interno (sem área de atuação, sem código de indicação
// editável). Ver update.ts para parceiro.
function registerRoutersServicesProducersByIdUpdateInternal(server: Server) {
	server.patch(
		'/internal',
		zValidator('json', SchemaProducerInternalUpdate),
		async (ctx) => {
			try {
				const id = ctx.req.param('id') as string;
				const brokerId = ctx.session.brokerId;

				if (!brokerId) {
					throw new Error('Nenhuma corretora vinculada');
				}

				const { name, phone, percentage, typeOfPayment, startOfPayment, pix } =
					ctx.req.valid('json');

				const member = await ctx.database.member.findUnique({
					where: {
						brokerId_userId: {
							brokerId,
							userId: id,
						},
					},
					select: {
						id: true,
						typeOfProduction: true,
					},
				});

				if (!member) {
					throw new Error('Produtor não encontrado');
				}

				if (member.typeOfProduction) {
					throw new Error('Esse cadastro é de um parceiro, não de um produtor');
				}

				await ctx.database.$transaction([
					ctx.database.user.update({
						where: { id },
						data: { name, phone, pix },
					}),
					ctx.database.member.update({
						where: { id: member.id },
						data: {
							percentageOfProduction: percentage,
							typeOfProductionPayment: typeOfPayment,
							startOfProductionPayment: startOfPayment,
						},
					}),
				]);

				return ctx.json({ message: 'Atualizado com sucesso' }, 200);
			} catch (error) {
				let message = 'Falha ao atualizar produtor';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json({ message }, 500);
			}
		},
	);
}

export { registerRoutersServicesProducersByIdUpdateInternal };
