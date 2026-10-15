import type { Context } from '@/@types/server';
import { Role, StatusInvitation } from '@segwise/database/enums';

type Resolved = {
	userId: string;
	brokerId: string;
	memberId: string | null;
	// true enquanto o produtor ainda não aceitou o convite (e-mail não confirmado)
	pending: boolean;
};

// Produtor/parceiro pelo código de indicação. Vale também para quem ainda não
// confirmou o e-mail: o usuário já existe desde o cadastro, só falta virar
// membro no aceite do convite. Antes disso as cotações e propostas já podem ser
// atribuídas a ele; o login continua exigindo o e-mail confirmado.
async function resolveProducerByReferral(
	ctx: Pick<Context, 'database'>,
	referral: string,
): Promise<Resolved | null> {
	const member = await ctx.database.member.findUnique({
		where: { referral },
		select: { id: true, userId: true, brokerId: true },
	});

	if (member) {
		return {
			userId: member.userId,
			brokerId: member.brokerId,
			memberId: member.id,
			pending: false,
		};
	}

	const invitation = await ctx.database.invitation.findUnique({
		where: { referral },
		select: { email: true, brokerId: true, role: true, status: true },
	});

	if (
		!invitation?.brokerId ||
		invitation.role !== Role.producer ||
		invitation.status !== StatusInvitation.pending
	) {
		return null;
	}

	const user = await ctx.database.user.findUnique({
		where: { email: invitation.email },
		select: { id: true },
	});

	return user
		? {
				userId: user.id,
				brokerId: invitation.brokerId,
				memberId: null,
				pending: true,
			}
		: null;
}

export { resolveProducerByReferral };
