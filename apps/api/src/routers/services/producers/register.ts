import { zValidator } from '@hono/zod-validator';
import {
	type ProducerRegisterResponse,
	SchemaProducerRegister,
} from '@segwise/core';
import { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { buildProducerPortalUrl } from '@/functions/hostname/build-producer-portal-url';
import { findOrCreateProducerUser } from '@/functions/producers/find-or-create-producer-user';
import { Role, StatusInvitation } from '@/generated/prisma/enums';

// Mesma validade configurada no better-auth (`invitationExpiresIn`).
const INVITATION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 30;

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
			password,
		} = ctx.req.valid('json');

		if (!brokerId) {
			throw new Error('Nenhuma corretora vinculada');
		}

		let createdUserId: string | null = null;

		try {
			const { userId, created, passwordApplied, verified } =
				await findOrCreateProducerUser(ctx, {
					name,
					email,
					phone,
					cpfOrCnpj,
					password,
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

			const confirmOnly = passwordApplied || verified;

			// Recadastro de parceiro ainda pendente: o better-auth (`resend`) só
			// renova a validade e mantém os demais campos do convite antigo. Atualiza
			// com o que foi digitado agora (inclusive `confirmOnly`) antes do envio.
			const pending = await ctx.database.invitation.findFirst({
				where: { brokerId, email },
				select: { id: true, role: true },
			});

			if (pending) {
				if (pending.role !== Role.producer) {
					throw new Error(
						'Já existe um convite de outro tipo pendente para este e-mail',
					);
				}

				await ctx.database.invitation.update({
					where: { id: pending.id },
					data: {
						referral,
						invitationMessage: message ?? null,
						typeOfProduction: type,
						percentageOfProduction: percentage,
						typeOfProductionPayment: typeOfPayment,
						startOfProductionPayment: startOfPayment,
						confirmOnly,
						status: StatusInvitation.pending,
						expiresAt: new Date(Date.now() + INVITATION_EXPIRES_IN_MS),
					},
				});
			}

			await ctx.auth.api.createInvitation({
				body: {
					email,
					organizationId: brokerId,
					role: Role.producer,
					referral,
					...(!!message && {
						invitationMessage: message,
					}),
					// Acesso já definido (senha criada aqui, ou conta que já existe e foi
					// confirmada): o e-mail só confirma e leva ao login.
					confirmOnly,
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

			// A senha NÃO volta na resposta: o painel já a tem no estado do formulário.
			return ctx.json(
				{
					message: 'Cadastrado com sucesso!',
					accessUrl: buildProducerPortalUrl(ctx.environment, '/sign-in'),
					passwordApplied,
				} satisfies ProducerRegisterResponse,
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
