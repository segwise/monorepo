import { zValidator } from '@hono/zod-validator';
import {
	generateReferral,
	isCNPJ,
	isCPF,
	SchemaProducerPublicRegister,
} from '@segwise/core';
import { XiorError } from 'xior';
import z from 'zod';
import type { Context, Server } from '@/@types/server';
import { selectPrisma as selectPrismaBrokerPublic } from '@/db-adapters/broker/public';
import { serializer as serializerBrokerPublic } from '@/db-serializers/broker/public';
import { buildAcceptInvitationUrl } from '@/functions/hostname/build-accept-invitation-url';
import { Role, TypeOfProductionPayment } from '@/generated/prisma/enums';
import { InvitePartnerEmail } from '../../../templates/invite-partner';

const SchemaBrokerSlugParam = z.object({
	slug: z.string().min(1, 'Corretora inválida'),
});

// Defaults para o auto-cadastro público: o parceiro não escolhe comissão,
// forma/dia de pagamento nem tipo de parceria — fica igual para todo mundo
// que entra por esse link, definido aqui no backend.
// `typeOfProduction` fica de fora de propósito: "produtor comum" (sem
// especialização) é representado como null no banco, igual ao fluxo do
// admin quando ele escolhe a opção "Produtor" no formulário (ver
// backoffice/src/containers/dialogs/producers/register.tsx).
const PUBLIC_REGISTER_DEFAULTS = {
	percentage: 10,
	typeOfPayment: TypeOfProductionPayment.monthly,
	startOfPayment: 5,
	invitationExpiresInMs: 1000 * 60 * 60 * 24 * 30,
} as const;

function buildInvitationMessage(name: string, referral: string) {
	return `Novidade\nA ${name} em parceria com a Segwise vem ofertar a promoção\n\nGANHE EM DOBRO\n1 - Orientações em caso de sinistro\n2 - Consulta veicular\n3 - Acesso direto às assistências das seguradoras\n4 - Plataforma de compra e venda de veículos mais segura ( apenas clientes segwise/xcar tem acesso)\n5 - Inclua todos os seguros da família, ganhe agilidade na consulta das renovações e acesso às assistências\n\nBaixe agora o aplicativo *SEGWISE*\n\nUtilize o código *${referral.toUpperCase()}*\n\nDescontos reais e exclusivos na renovação ou aquisição do seu seguro\n\nGaranta seus benefícios\n\nou acesse pelo link abaixo:`;
}

async function generateUniqueReferral(ctx: Context) {
	for (let attempt = 0; attempt < 5; attempt++) {
		const referral = generateReferral();

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

		if (!existingInvitation && !existingMember) {
			return referral;
		}
	}

	throw new Error('Falha ao gerar código de indicação, tente novamente');
}

function registerRoutersServicesProducersPublicRegister(server: Server) {
	const base = server.basePath('/public/:slug');

	base.get('/', zValidator('param', SchemaBrokerSlugParam), async (ctx) => {
		const { slug } = ctx.req.valid('param');

		const broker = await ctx.database.broker.findUnique({
			where: { slug },
			select: selectPrismaBrokerPublic,
		});

		if (!broker) {
			return ctx.json({ message: 'Corretora não encontrada' }, 404);
		}

		return ctx.json(
			serializerBrokerPublic(broker, { storage: ctx.storage.images }),
			200,
		);
	});

	base.post(
		'/',
		zValidator('param', SchemaBrokerSlugParam),
		zValidator('json', SchemaProducerPublicRegister),
		async (ctx) => {
			const { slug } = ctx.req.valid('param');
			const { name, phone, email, cpfOrCnpj, pix } = ctx.req.valid('json');

			let createdUserId: string | null = null;

			try {
				const broker = await ctx.database.broker.findUnique({
					where: { slug },
					select: { id: true, name: true },
				});

				if (!broker) {
					return ctx.json({ message: 'Corretora não encontrada' }, 404);
				}

				const inviter = await ctx.database.member.findFirst({
					where: {
						brokerId: broker.id,
						role: { in: [Role.owner, Role.admin] },
					},
					select: { userId: true },
					orderBy: { id: 'asc' },
				});

				if (!inviter) {
					throw new Error(
						'Corretora sem responsável configurado para receber cadastros',
					);
				}

				const existingInvitation = await ctx.database.invitation.findUnique({
					where: {
						brokerId_email: {
							brokerId: broker.id,
							email,
						},
					},
					select: { id: true },
				});

				if (existingInvitation) {
					throw new Error(
						'Já existe um cadastro pendente para este e-mail nesta corretora. Verifique sua caixa de entrada.',
					);
				}

				const isUser = await ctx.database.user.findFirst({
					where: {
						OR: [{ cpf: cpfOrCnpj }, { cnpj: cpfOrCnpj }],
					},
					select: { id: true },
				});

				let userId: string;

				if (isUser) {
					userId = isUser.id;
				} else {
					const { user } = await ctx.auth.api.createUser({
						body: {
							name,
							email,
							password: Bun.randomUUIDv7(),
							// @ts-expect-error
							role: Role.customer,
							...(isCPF(cpfOrCnpj) && { cpf: cpfOrCnpj }),
							...(isCNPJ(cpfOrCnpj) && { cnpj: cpfOrCnpj }),
							phone,
						},
					});

					userId = user.id;
					createdUserId = user.id;
				}

				await ctx.database.user.update({
					where: { id: userId },
					data: { pix },
				});

				const isMember = await ctx.database.member.findUnique({
					where: {
						brokerId_userId: {
							brokerId: broker.id,
							userId,
						},
					},
				});

				if (isMember) {
					throw new Error('Você já está cadastrado nesta corretora');
				}

				const referral = await generateUniqueReferral(ctx);

				const invitation = await ctx.database.invitation.create({
					data: {
						brokerId: broker.id,
						email,
						role: Role.producer,
						referral,
						percentageOfProduction: PUBLIC_REGISTER_DEFAULTS.percentage,
						typeOfProductionPayment: PUBLIC_REGISTER_DEFAULTS.typeOfPayment,
						startOfProductionPayment: PUBLIC_REGISTER_DEFAULTS.startOfPayment,
						invitationMessage: buildInvitationMessage(name, referral),
						inviterId: inviter.userId,
						expiresAt: new Date(
							Date.now() + PUBLIC_REGISTER_DEFAULTS.invitationExpiresInMs,
						),
					},
					select: { id: true },
				});

				const url = buildAcceptInvitationUrl(ctx.environment, invitation.id);

				await ctx.email.emails.send({
					from: 'Segwise <invite@emails.xcarcorretora.com.br>',
					to: email,
					subject: 'Aceitar convite de produção',
					react: InvitePartnerEmail({ company: broker.name, url }),
				});

				return ctx.json(
					{
						message:
							'Cadastro recebido! Enviamos um e-mail para você confirmar sua conta e criar sua senha de acesso.',
					},
					200,
				);
			} catch (error) {
				let message = 'Falha ao concluir cadastro';

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

export { registerRoutersServicesProducersPublicRegister };
