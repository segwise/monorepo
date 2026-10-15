import type { Context } from '@/@types/server';

// CPF é único entre usuários. Recusa se pertence a outra pessoa; nunca grava um
// CPF digitado numa conta que não seja a do próprio cadastro em andamento.
async function assertCpfAvailable(
	ctx: Pick<Context, 'database'>,
	cpf: string,
	exceptUserId?: string,
) {
	const owner = await ctx.database.user.findFirst({
		where: { cpf, ...(exceptUserId && { id: { not: exceptUserId } }) },
		select: { id: true },
	});

	if (owner) {
		throw new Error('Este CPF já está cadastrado para outro usuário');
	}
}

export { assertCpfAvailable };
