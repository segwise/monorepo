import type { StaffRole } from '@segwise/core';
import { canManageStaffRole, translateStaffRole } from '@segwise/core';
import type { Context, Server } from '@/@types/server';
import { buildAcceptInvitationUrl } from '@/functions/hostname/build-accept-invitation-url';
import { getUsersActor } from '@/functions/users/context';
import { Role, StatusInvitation } from '@segwise/database/enums';
import { InvitePartnerEmail } from '../../../templates/invite-partner';

const INVITATION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 30;

function registerRoutersServicesUsersInvitations(server: Server) {
	async function findInvitation(ctx: Context, brokerId: string) {
		return await ctx.database.invitation.findFirst({
			where: {
				id: ctx.req.param('id') as string,
				brokerId,
				status: StatusInvitation.pending,
				role: { not: Role.producer },
			},
			select: { id: true, email: true, role: true },
		});
	}

	server.delete('/invitations/:id', async (ctx) => {
		const actor = getUsersActor(ctx);

		if (!actor) {
			return ctx.json({ message: 'Sem permissão para alterar usuários' }, 403);
		}

		const invitation = await findInvitation(ctx, actor.brokerId);

		if (!invitation) {
			return ctx.json({ message: 'Convite não encontrado' }, 404);
		}

		if (!canManageStaffRole(actor.role, invitation.role)) {
			return ctx.json(
				{ message: 'Você não tem permissão para esta alteração' },
				403,
			);
		}

		await ctx.database.invitation.delete({ where: { id: invitation.id } });

		return ctx.json({ message: 'Convite excluído com sucesso' }, 200);
	});

	// Renova a validade e reenvia o e-mail.
	server.post('/invitations/:id/resend', async (ctx) => {
		const actor = getUsersActor(ctx);

		if (!actor) {
			return ctx.json({ message: 'Sem permissão para alterar usuários' }, 403);
		}

		const invitation = await findInvitation(ctx, actor.brokerId);

		if (!invitation) {
			return ctx.json({ message: 'Convite não encontrado' }, 404);
		}

		if (!canManageStaffRole(actor.role, invitation.role)) {
			return ctx.json(
				{ message: 'Você não tem permissão para esta alteração' },
				403,
			);
		}

		const [broker, invited] = await Promise.all([
			ctx.database.broker.findUnique({
				where: { id: actor.brokerId },
				select: { name: true },
			}),
			ctx.database.user.findUnique({
				where: { email: invitation.email },
				select: { name: true },
			}),
		]);

		const { error } = await ctx.email.emails.send({
			from: 'Segwise <invite@emails.xcarcorretora.com.br>',
			to: invitation.email,
			subject: 'Aceitar convite de acesso',
			react: InvitePartnerEmail({
				company: broker?.name ?? '',
				url: buildAcceptInvitationUrl(ctx.environment, invitation.id),
				name: invited?.name,
				roleLabel: translateStaffRole(invitation.role as StaffRole),
			}),
		});

		if (error) {
			return ctx.json(
				{ message: 'Não foi possível reenviar o e-mail. Tente novamente.' },
				500,
			);
		}

		await ctx.database.invitation.update({
			where: { id: invitation.id },
			data: { expiresAt: new Date(Date.now() + INVITATION_EXPIRES_IN_MS) },
		});

		return ctx.json({ message: 'Convite reenviado com sucesso' }, 200);
	});
}

export { registerRoutersServicesUsersInvitations };
