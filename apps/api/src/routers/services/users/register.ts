import { zValidator } from '@hono/zod-validator';
import {
	assignableStaffRoles,
	canManageStaffRole,
	SchemaUserRegister,
	translateStaffRole,
} from '@segwise/core';
import { Role, StatusInvitation, StatusMember } from '@segwise/database/enums';
import type { Server } from '@/@types/server';
import { buildAcceptInvitationUrl } from '@/functions/hostname/build-accept-invitation-url';
import { generateUniqueReferral } from '@/functions/producers/generate-unique-referral';
import { getUsersActor } from '@/functions/users/context';
import { assertCpfAvailable } from '@/functions/users/cpf';
import { InvitePartnerEmail } from '../../../templates/invite-partner';

const INVITATION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 30;

// Cadastro de membro da equipe: cria o usuário (se ainda não existe), um convite
// com o perfil escolhido e manda o e-mail para a pessoa definir a senha. O perfil
// só pode ser de nível abaixo do de quem cadastra.
function registerRoutersServicesUsersRegister(server: Server) {
	server.post('/', zValidator('json', SchemaUserRegister), async (ctx) => {
		const actor = getUsersActor(ctx);

		if (!actor) {
			return ctx.json(
				{ message: 'Sem permissão para cadastrar usuários' },
				403,
			);
		}

		const { name, email, cpf, phone, role } = ctx.req.valid('json');

		if (!assignableStaffRoles(actor.role).includes(role)) {
			return ctx.json(
				{ message: 'Você não pode cadastrar um usuário com esse perfil' },
				403,
			);
		}

		let createdUserId: string | null = null;
		let invitationId: string | null = null;

		try {
			const broker = await ctx.database.broker.findUnique({
				where: { id: actor.brokerId },
				select: { name: true },
			});

			if (!broker) {
				throw new Error('Corretora não encontrada');
			}

			const [existingUser, existingInvitation] = await Promise.all([
				ctx.database.user.findUnique({
					where: { email },
					select: {
						id: true,
						cpf: true,
						members: {
							where: { brokerId: actor.brokerId },
							select: { id: true, role: true, status: true },
						},
					},
				}),
				ctx.database.invitation.findUnique({
					where: { brokerId_email: { brokerId: actor.brokerId, email } },
					select: { id: true, status: true },
				}),
			]);

			const current = existingUser?.members[0];

			// Excluído (lógico) volta pelo mesmo vínculo: todos os dados ligados a
			// ele continuam. Só restaura quem o cadastrante poderia gerenciar.
			if (
				current?.status === StatusMember.deleted &&
				current.role !== Role.producer
			) {
				if (!canManageStaffRole(actor.role, current.role)) {
					return ctx.json(
						{
							message:
								'Este usuário foi excluído e tinha um perfil acima do seu. Peça a quem tem permissão para restaurá-lo.',
						},
						403,
					);
				}

				if (cpf) {
					await assertCpfAvailable(ctx, cpf, existingUser?.id);

					if (existingUser?.cpf && existingUser.cpf !== cpf) {
						throw new Error('Este e-mail já está cadastrado para outro CPF');
					}
				}

				await ctx.database.$transaction([
					ctx.database.user.update({
						where: { id: existingUser?.id },
						data: {
							name,
							...(phone && { phone }),
							...(cpf && !existingUser?.cpf && { cpf }),
						},
					}),
					ctx.database.member.update({
						where: { id: current.id },
						data: { role, status: StatusMember.active },
					}),
				]);

				return ctx.json(
					{
						message:
							'Usuário restaurado com os dados e o histórico anteriores. Ele entra com a senha que já tinha.',
					},
					200,
				);
			}

			if (current) {
				throw new Error(
					current.role === Role.producer
						? 'Este e-mail é de um produtor/parceiro desta corretora'
						: 'Este e-mail já faz parte da equipe da corretora',
				);
			}

			if (existingInvitation?.status === StatusInvitation.pending) {
				throw new Error('Já existe um convite pendente para este e-mail');
			}

			if (cpf) {
				await assertCpfAvailable(ctx, cpf, existingUser?.id);

				if (existingUser?.cpf && existingUser.cpf !== cpf) {
					throw new Error('Este e-mail já está cadastrado para outro CPF');
				}
			}

			if (!existingUser) {
				const { user } = await ctx.auth.api.createUser({
					body: {
						name,
						email,
						password: Bun.randomUUIDv7(),
						// @ts-expect-error
						role: Role.customer,
					},
				});

				createdUserId = user.id;

				if (phone || cpf) {
					await ctx.database.user.update({
						where: { id: user.id },
						data: { ...(phone && { phone }), ...(cpf && { cpf }) },
					});
				}
			} else if (cpf && !existingUser.cpf) {
				await ctx.database.user.update({
					where: { id: existingUser.id },
					data: { cpf },
				});
			}

			const referral = await generateUniqueReferral(ctx);

			const invitation = await ctx.database.invitation.create({
				data: {
					brokerId: actor.brokerId,
					email,
					role,
					referral,
					inviterId: actor.userId,
					expiresAt: new Date(Date.now() + INVITATION_EXPIRES_IN_MS),
				},
				select: { id: true },
			});

			invitationId = invitation.id;

			const { error } = await ctx.email.emails.send({
				from: 'Segwise <invite@emails.xcarcorretora.com.br>',
				to: email,
				subject: 'Aceitar convite de acesso',
				react: InvitePartnerEmail({
					company: broker.name,
					url: buildAcceptInvitationUrl(ctx.environment, invitation.id),
					name,
					roleLabel: translateStaffRole(role),
				}),
			});

			if (error) {
				throw new Error(
					'Não foi possível enviar o e-mail de convite. Tente novamente.',
				);
			}

			return ctx.json({ message: 'Convite enviado com sucesso!' }, 200);
		} catch (error) {
			if (invitationId) {
				await ctx.database.invitation
					.delete({ where: { id: invitationId } })
					.catch(() => {});
			}

			if (createdUserId) {
				await ctx.database.user
					.delete({ where: { id: createdUserId } })
					.catch(() => {});
			}

			return ctx.json(
				{
					message:
						error instanceof Error
							? error.message
							: 'Falha ao cadastrar usuário',
				},
				500,
			);
		}
	});
}

export { registerRoutersServicesUsersRegister };
