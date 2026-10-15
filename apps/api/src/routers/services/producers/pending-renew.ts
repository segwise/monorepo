import type { Server } from '@/@types/server';
import { buildAcceptInvitationUrl } from '@/functions/hostname/build-accept-invitation-url';
import { StatusInvitation } from '@/generated/prisma/enums';
import { InvitePartnerEmail } from '../../../templates/invite-partner';

// Convites não têm um job que marca "expired" automaticamente — o vencimento
// é calculado no front comparando expiresAt com a data atual. Renovar só
// empurra expiresAt pra frente (mesma janela de 30 dias do cadastro) e
// reenvia o e-mail com o mesmo link (o token/id do convite não muda).
const INVITATION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 30;

function registerRoutersServicesProducersPendingRenew(server: Server) {
	server.patch('/pending/:id/renew', async (ctx) => {
		try {
			const id = ctx.req.param('id');

			const brokerId = ctx.session.brokerId;

			if (!brokerId) {
				throw new Error('Nenhuma corretora vinculada');
			}

			const invitation = await ctx.database.invitation.findFirst({
				where: { id, brokerId },
				select: {
					id: true,
					email: true,
					confirmOnly: true,
					broker: {
						select: { name: true },
					},
				},
			});

			if (!invitation) {
				throw new Error('Convite não encontrado');
			}

			await ctx.database.invitation.update({
				where: { id: invitation.id },
				data: {
					status: StatusInvitation.pending,
					expiresAt: new Date(Date.now() + INVITATION_EXPIRES_IN_MS),
				},
			});

			const url = buildAcceptInvitationUrl(ctx.environment, invitation.id);

			await ctx.email.emails.send({
				from: 'Segwise <invite@emails.xcarcorretora.com.br>',
				to: invitation.email,
				subject: invitation.confirmOnly
					? 'Confirmar acesso à plataforma'
					: 'Aceitar convite de produção',
				react: InvitePartnerEmail({
					company: invitation.broker?.name || '',
					url,
					confirmOnly: invitation.confirmOnly,
				}),
			});

			return ctx.json({ message: 'Convite renovado com sucesso' }, 200);
		} catch (error) {
			let message = 'Falha ao renovar convite';

			if (error instanceof Error) {
				message = error.message;
			}

			return ctx.json({ message }, 500);
		}
	});
}

export { registerRoutersServicesProducersPendingRenew };
