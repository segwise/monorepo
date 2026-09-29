import { zValidator } from '@hono/zod-validator';
import { SchemaProducerPartnerUpdate } from '@segwise/core';
import type { Server } from '@/@types/server';

// Edição de PARCEIRO (tem área de atuação + código de indicação). Ver
// update-internal.ts para produtor.
function registerRoutersServicesProducersByIdUpdate(server: Server) {
	server.patch(
		'/',
		zValidator('json', SchemaProducerPartnerUpdate),
		async (ctx) => {
			try {
				const id = ctx.req.param('id') as string;
				const brokerId = ctx.session.brokerId;

				if (!brokerId) {
					throw new Error('Nenhuma corretora vinculada');
				}

				const {
					name,
					phone,
					type,
					referral,
					percentage,
					typeOfPayment,
					startOfPayment,
					pix,
				} = ctx.req.valid('json');

				const member = await ctx.database.member.findUnique({
					where: {
						brokerId_userId: {
							brokerId,
							userId: id,
						},
					},
					select: {
						id: true,
						referral: true,
						typeOfProduction: true,
					},
				});

				if (!member) {
					throw new Error('Parceiro não encontrado');
				}

				if (!member.typeOfProduction) {
					throw new Error('Esse cadastro é de um produtor, não de um parceiro');
				}

				if (referral !== member.referral) {
					const [existingInvitation, existingMember] = await Promise.all([
						ctx.database.invitation.findUnique({
							where: { referral },
							select: { id: true },
						}),
						ctx.database.member.findUnique({
							where: { referral },
							select: { id: true },
						}),
					]);

					if (existingInvitation || existingMember) {
						throw new Error(
							'Código de indicação já está em uso. Escolha outro.',
						);
					}
				}

				await ctx.database.$transaction([
					ctx.database.user.update({
						where: { id },
						data: { name, phone, pix },
					}),
					ctx.database.member.update({
						where: { id: member.id },
						data: {
							typeOfProduction: type,
							referral,
							percentageOfProduction: percentage,
							typeOfProductionPayment: typeOfPayment,
							startOfProductionPayment: startOfPayment,
						},
					}),
				]);

				return ctx.json({ message: 'Atualizado com sucesso' }, 200);
			} catch (error) {
				let message = 'Falha ao atualizar parceiro';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json({ message }, 500);
			}
		},
	);
}

export { registerRoutersServicesProducersByIdUpdate };
