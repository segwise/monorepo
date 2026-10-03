import { zValidator } from '@hono/zod-validator';
import { SchemaProducerRegister } from '@segwise/core';
import { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { findOrCreateProducerUser } from '@/functions/producers/find-or-create-producer-user';
import { Role } from '@/generated/prisma/enums';

function registerRoutersServicesProducersRegister(server: Server) {
	server.post('/', zValidator('json', SchemaProducerRegister), async (ctx) => {
		const brokerId = ctx.session.brokerId;

		const {
			type,
			name,
			phone,
			email,
			typeOfPayment,
			percentage,
			startOfPayment,
			referral,
			cpfOrCnpj,
			message,
			pix,
		} = ctx.req.valid('json');

		if (!brokerId) {
			throw new Error('Nenhuma corretora vinculada');
		}

		let createdUserId: string | null = null;

		try {
			const { userId, created } = await findOrCreateProducerUser(ctx, {
				name,
				email,
				phone,
				cpfOrCnpj,
			});

			if (created) {
				createdUserId = userId;
			}

			const isMember = await ctx.database.member.findUnique({
				where: {
					brokerId_userId: {
						brokerId,
						userId,
					},
				},
			});

			if (isMember) {
				throw new Error('Usuário já vinculado a corretora');
			}

			await ctx.database.user.update({
				where: { id: userId },
				data: { pix },
			});

			await ctx.auth.api.createInvitation({
				body: {
					email,
					organizationId: brokerId,
					role: Role.producer,
					referral,
					...(!!message && {
						invitationMessage: message,
					}),
					typeOfProduction: type,
					...(percentage && {
						percentageOfProduction: percentage,
					}),
					...(typeOfPayment && {
						typeOfProductionPayment: typeOfPayment,
					}),
					...(startOfPayment && {
						startOfProductionPayment: startOfPayment,
					}),
					resend: true,
				},
				headers: ctx.req.raw.headers,
			});

			return ctx.json(
				{
					message: 'Cadastrado com sucesso!',
				},
				200,
			);
		} catch (error) {
			let message = 'Falha ao registrar produtor';

			// Só desfaz o usuário que este cadastro criou: nunca apaga um existente.
			if (createdUserId) {
				await ctx.database.user.delete({
					where: {
						id: createdUserId,
					},
				});
			}

			if (error instanceof Error) {
				message = error.message;
			}

			if (error instanceof XiorError) {
				if (error.response?.data.message) {
					message = error.response.data.message;
				}
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

export { registerRoutersServicesProducersRegister };
