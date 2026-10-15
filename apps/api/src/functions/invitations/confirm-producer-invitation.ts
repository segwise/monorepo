import { Role } from '@segwise/database/enums';
import type { Context } from '@/@types/server';

type Outcome =
	// Acesso confirmado agora.
	| 'confirmed'
	// Convite já consumido (clique repetido, prefetch de antivírus de e-mail...)
	// ou inexistente: o destino é o mesmo, o login.
	| 'used'
	| 'expired'
	| 'error';

// Confirma o acesso de um parceiro cuja senha a corretora já definiu no cadastro
// (`Invitation.confirmOnly`): e-mail verificado + vínculo com a corretora, tudo
// numa transação. O convite é apagado PRIMEIRO e a contagem decide quem confirma:
// se dois cliques chegam juntos, só um segue e o outro vê "já utilizado" sem erro.
async function confirmProducerInvitation(
	ctx: Pick<Context, 'database'>,
	token: string,
): Promise<Outcome> {
	const invitation = await ctx.database.invitation.findUnique({
		where: { id: token },
		select: {
			email: true,
			role: true,
			referral: true,
			brokerId: true,
			expiresAt: true,
			typeOfProduction: true,
			percentageOfProduction: true,
			typeOfProductionPayment: true,
			startOfProductionPayment: true,
			invitationMessage: true,
		},
	});

	if (!invitation) {
		return 'used';
	}

	if (invitation.expiresAt < new Date()) {
		return 'expired';
	}

	if (!invitation.brokerId || invitation.role !== Role.producer) {
		return 'error';
	}

	const user = await ctx.database.user.findUnique({
		where: { email: invitation.email },
		select: { id: true },
	});

	if (!user) {
		return 'error';
	}

	const brokerId = invitation.brokerId;

	return await ctx.database.$transaction(async (transaction) => {
		const { count } = await transaction.invitation.deleteMany({
			where: { id: token },
		});

		if (count === 0) {
			return 'used' as const;
		}

		await transaction.user.update({
			where: { id: user.id },
			data: { emailVerified: true },
		});

		await transaction.member.create({
			data: {
				userId: user.id,
				brokerId,
				role: Role.producer,
				referral: invitation.referral,
				typeOfProduction: invitation.typeOfProduction,
				percentageOfProduction: invitation.percentageOfProduction,
				typeOfProductionPayment: invitation.typeOfProductionPayment,
				startOfProductionPayment: invitation.startOfProductionPayment,
				invitationMessage: invitation.invitationMessage,
			},
		});

		return 'confirmed' as const;
	});
}

export {
	confirmProducerInvitation,
	type Outcome as ConfirmProducerInvitationOutcome,
};
