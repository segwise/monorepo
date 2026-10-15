import { generateReferral } from '@segwise/core';
import type { Context } from '@/@types/server';

// Reaproveitado por qualquer fluxo que precise gerar um código de indicação
// sem pedir pro usuário (produtor interno, por exemplo — parceiro escolhe o
// próprio código no formulário público). `referral` é único tanto em
// Invitation quanto em Member.
async function generateUniqueReferral(
	ctx: Pick<Context, 'database'>,
): Promise<string> {
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

export { generateUniqueReferral };
