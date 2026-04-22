import { zValidator } from '@hono/zod-validator';
import {
	isCNPJ,
	isCPF,
	SchemaProducerRegister,
	SchemaProducerType,
} from '@segwise/core';
import { XiorError } from 'xior';
import type { Server } from '@/@types/server';
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
		} = ctx.req.valid('json');

		if (!brokerId) {
			throw new Error('Nenhuma corretora vinculada');
		}

		let userId: string | null = null;

		try {
			const isUser = await ctx.database.user.findFirst({
				where: {
					OR: [
						{
							cpf: cpfOrCnpj,
						},
						{
							cnpj: cpfOrCnpj,
						},
					],
				},
				select: {
					id: true,
				},
			});

			if (!isUser) {
				const { user } = await ctx.auth.api.createUser({
					body: {
						name,
						email,
						password: Bun.randomUUIDv7(),
						// @ts-expect-error
						role: Role.customer,
						...(isCPF(cpfOrCnpj) && {
							cpf: cpfOrCnpj,
						}),
						...(isCNPJ(cpfOrCnpj) && {
							cnpj: cpfOrCnpj,
						}),
						phone,
					},
				});

				userId = user.id;
			} else {
				userId = isUser.id;
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

			await ctx.auth.api.createInvitation({
				body: {
					email,
					organizationId: brokerId,
					role: Role.producer,
					referral,
					...(!!message && {
						invitationMessage: message,
					}),
					...(type &&
						type !== SchemaProducerType.enum.producer && {
							typeOfProduction: type,
						}),
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

			if (userId) {
				await ctx.database.user.delete({
					where: {
						id: userId,
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
