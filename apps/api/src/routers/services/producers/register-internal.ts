import { zValidator } from '@hono/zod-validator';
import { SchemaProducerRegisterInternal } from '@segwise/core';
import { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { findOrCreateProducerUser } from '@/functions/producers/find-or-create-producer-user';
import { generateUniqueReferral } from '@/functions/producers/generate-unique-referral';
import { Role } from '@/generated/prisma/enums';

// Cadastro de PRODUTOR interno — sem área de atuação, sem mensagem
// promocional e sem pedir código de indicação (gerado automático aqui).
// Fluxo de PARCEIRO fica em register.ts (admin) e public-register.ts
// (link público), que usam SchemaProducerRegister/SchemaProducerPublicRegister.
function registerRoutersServicesProducersRegisterInternal(server: Server) {
	server.post(
		'/internal',
		zValidator('json', SchemaProducerRegisterInternal),
		async (ctx) => {
			const brokerId = ctx.session.brokerId;

			const {
				name,
				phone,
				email,
				typeOfPayment,
				percentage,
				startOfPayment,
				cpfOrCnpj,
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

				const referral = await generateUniqueReferral(ctx);

				await ctx.auth.api.createInvitation({
					body: {
						email,
						organizationId: brokerId,
						role: Role.producer,
						referral,
						percentageOfProduction: percentage,
						typeOfProductionPayment: typeOfPayment,
						startOfProductionPayment: startOfPayment,
						resend: true,
					},
					headers: ctx.req.raw.headers,
				});

				return ctx.json({ message: 'Cadastrado com sucesso!' }, 200);
			} catch (error) {
				let message = 'Falha ao registrar produtor';

				if (createdUserId) {
					await ctx.database.user.delete({ where: { id: createdUserId } });
				}

				if (error instanceof Error) {
					message = error.message;
				}

				if (error instanceof XiorError) {
					if (error.response?.data.message) {
						message = error.response.data.message;
					}
				}

				return ctx.json({ message }, 500);
			}
		},
	);
}

export { registerRoutersServicesProducersRegisterInternal };
