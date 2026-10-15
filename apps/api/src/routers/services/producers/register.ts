import { zValidator } from '@hono/zod-validator';
import {
	type ProducerRegisterResponse,
	SchemaProducerRegister,
} from '@segwise/core';
import { XiorError } from 'xior';
import type { Server } from '@/@types/server';
import { buildProducerPortalUrl } from '@/functions/hostname/build-producer-portal-url';
import { findOrCreateProducerUser } from '@/functions/producers/find-or-create-producer-user';
import { Role } from '@segwise/database/enums';

// Cadastro de PARCEIRO pelo painel: sem CPF/CNPJ e sem e-mail de confirmação. A
// corretora define a senha e o acesso nasce liberado: o e-mail é marcado como
// confirmado aqui (só quando a senha foi definida neste cadastro, nunca em conta de
// terceiros) e o vínculo com a corretora já é criado ativo.
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

			// Conta que existe, não foi confirmada e cuja senha não pudemos definir
			// (já tem vínculo em outra corretora): não liberamos o acesso por ela.
			if (!passwordApplied && !verified) {
				throw new Error(
					'Este e-mail já tem um cadastro ainda não confirmado. Peça ao usuário para confirmá-lo ou use outro e-mail.',
				);
			}

			await ctx.database.$transaction(async (transaction) => {
				await transaction.user.update({
					where: { id: userId },
					data: {
						pix,
						// Confirmação "por baixo dos panos": quem definimos a senha aqui
						// já pode entrar, sem e-mail de confirmação.
						...(passwordApplied && { emailVerified: true }),
					},
				});

				// Convite pendente antigo do mesmo e-mail seria um segundo caminho de
				// aceite (e repetiria o código de indicação): sai de cena.
				await transaction.invitation.deleteMany({
					where: { brokerId, email },
				});

				await transaction.member.create({
					data: {
						userId,
						brokerId,
						role: Role.producer,
						referral,
						typeOfProduction: type,
						percentageOfProduction: percentage,
						typeOfProductionPayment: typeOfPayment,
						startOfProductionPayment: startOfPayment,
						...(message && { invitationMessage: message }),
					},
				});
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

			if ((error as { code?: string })?.code === 'P2002') {
				message = 'Este código de indicação já está em uso';
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
