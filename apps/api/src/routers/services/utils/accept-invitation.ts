import { zValidator } from '@hono/zod-validator';
import { SchemaPassword } from '@segwise/core';
import z from 'zod';
import type { Server } from '@/@types/server';
import { getMainDomain } from '@/functions/hostname/get-main-domain';
import { responseReplaceSession } from '@/functions/response/replace-session';
import { Role } from '@/generated/prisma/enums';

function registerRoutersServicesUtilsAcceptInvitation(server: Server) {
	const base = server.basePath('/accept-invitation');

	base.get(
		'/',
		zValidator(
			'query',
			z.object({
				token: z.uuidv7('Token inválido'),
			}),
		),
		async (ctx) => {
			const { token } = ctx.req.valid('query');

			console.log(token);

			const invitation = await ctx.database.invitation.findUnique({
				where: {
					id: token,
				},
				select: {
					role: true,
				},
			});

			console.log(invitation);

			if (invitation?.role === Role.producer) {
				const url = new URL(
					`http${ctx.environment.NODE_ENV !== 'development' ? 's' : ''}://${ctx.environment.NODE_ENV !== 'development' ? 'producer.' : ''}${getMainDomain(ctx.environment.APPLICATION_URL)}${ctx.environment.NODE_ENV === 'development' ? `:3000` : ''}`,
				);

				url.pathname = '/accept-invitation';

				url.searchParams.set('token', token);

				return ctx.redirect(url.toJSON(), 301);
			}

			return ctx.json(
				{
					message: 'Condição não programada',
				},
				200,
			);
		},
	);

	base.post(
		'/',
		zValidator(
			'json',
			z.object({
				token: z.uuidv7('Token inválido'),
				password: SchemaPassword,
			}),
		),
		async (ctx) => {
			try {
				const { token: id, password } = ctx.req.valid('json');

				const invitation = await ctx.database.invitation.findUnique({
					where: {
						id,
					},
					select: {
						email: true,
						referral: true,
						typeOfProduction: true,
						typeOfProductionPayment: true,
						percentageOfProduction: true,
						role: true,
						startOfProductionPayment: true,
						brokerId: true,
						invitationMessage: true,
					},
				});

				if (!invitation) {
					throw new Error('Código de convite não encontrado!');
				}

				const userId = await ctx.database.user
					.findUnique({
						where: {
							email: invitation.email,
						},
						select: {
							id: true,
						},
					})
					.then((response) => response?.id);

				if (!userId) {
					throw new Error('Usuário não encontrado!');
				}

				const account = await ctx.database.account.findFirst({
					where: {
						providerId: 'credential',
						userId,
					},
					select: {
						id: true,
					},
				});

				if (!account) {
					throw new Error('Perfil não encontrado!');
				}

				await ctx.database.$transaction(async (transaction) => {
					await transaction.$transaction([
						transaction.account.update({
							where: {
								id: account.id,
							},
							data: {
								password: await Bun.password.hash(password, 'argon2id'),
							},
						}),
						transaction.user.update({
							where: {
								id: userId,
							},
							data: {
								emailVerified: true,
							},
						}),
					]);

					await transaction.invitation.delete({
						where: {
							id,
						},
					});

					const member = await ctx.auth.api.addMember({
						body: {
							userId,
							organizationId: invitation.brokerId as string,
							referral: invitation.referral as string,
							// @ts-expect-error
							role: invitation.role,
						},
					});

					await transaction.member.update({
						where: {
							id: member.id,
						},
						data: {
							typeOfProduction: invitation.typeOfProduction,
							typeOfProductionPayment: invitation.typeOfProductionPayment,
							percentageOfProduction: invitation.percentageOfProduction,
							startOfProductionPayment: invitation.startOfProductionPayment,
							invitationMessage: invitation.invitationMessage,
						},
					});
				});

				const responseSignIn = await ctx.auth.api.signInEmail({
					body: {
						email: invitation.email,
						password,
					},
					asResponse: true,
				});

				const response = await responseReplaceSession(responseSignIn, ctx);

				return response;
			} catch (error) {
				let message = 'Falha ao aceitar convite';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json(
					{
						message,
					},
					500,
				);
			}
		},
	);
}

export { registerRoutersServicesUtilsAcceptInvitation };
