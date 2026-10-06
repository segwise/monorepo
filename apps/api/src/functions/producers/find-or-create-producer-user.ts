import { isCNPJ, isCPF } from '@segwise/core';
import type { Context } from '@/@types/server';
import { Role } from '@/generated/prisma/enums';

type Input = {
	name: string;
	email: string;
	phone: string;
	cpfOrCnpj: string;
};

type Result = {
	userId: string;
	// true só quando o usuário foi criado agora: é o único caso em que ele pode
	// ser apagado se o resto do cadastro falhar.
	created: boolean;
};

function friendlyAuthError(error: unknown): Error {
	const message = error instanceof Error ? error.message : '';

	if (/already exists|use another email/i.test(message)) {
		return new Error('Já existe um usuário cadastrado com este e-mail');
	}

	return error instanceof Error ? error : new Error('Falha ao criar usuário');
}

// Usado pelos três cadastros de produtor/parceiro (interno, admin e link público).
// - Reaproveita o usuário que já existe por CPF/CNPJ ou por e-mail (sem nunca
//   atribuir o CPF/CNPJ digitado a uma conta de equipe só pelo e-mail).
// - O convite é enviado para o e-mail do usuário (o aceite procura o usuário por
//   esse e-mail), então um CPF/CNPJ já cadastrado com outro e-mail é recusado.
// - CPF/CNPJ e celular são gravados explicitamente: o `createUser` do
//   better-auth não grava campos que não são do schema dele.
async function findOrCreateProducerUser(
	ctx: Pick<Context, 'database' | 'auth'>,
	{ name, email, phone, cpfOrCnpj }: Input,
): Promise<Result> {
	const document = isCPF(cpfOrCnpj)
		? { cpf: cpfOrCnpj }
		: isCNPJ(cpfOrCnpj)
			? { cnpj: cpfOrCnpj }
			: null;

	if (!document) {
		throw new Error('CPF ou CNPJ inválido');
	}

	const [byDocument, byEmail] = await Promise.all([
		ctx.database.user.findFirst({
			where: { OR: [{ cpf: cpfOrCnpj }, { cnpj: cpfOrCnpj }] },
			select: { id: true, email: true, cpf: true, cnpj: true, phone: true },
		}),
		ctx.database.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				cpf: true,
				cnpj: true,
				phone: true,
				members: { select: { role: true } },
			},
		}),
	]);

	if (byDocument && byEmail && byDocument.id !== byEmail.id) {
		throw new Error(
			`Este CPF/CNPJ pertence a outro usuário (${byDocument.email}) e o e-mail informado a ${byEmail.email}. Confira os dados.`,
		);
	}

	if (byDocument) {
		if (byDocument.email !== email) {
			throw new Error(
				`Este CPF/CNPJ já está cadastrado com o e-mail ${byDocument.email}. Use o mesmo e-mail.`,
			);
		}

		if (!byDocument.phone) {
			await ctx.database.user.update({
				where: { id: byDocument.id },
				data: { phone },
			});
		}

		return { userId: byDocument.id, created: false };
	}

	if (byEmail) {
		if (byEmail.cpf || byEmail.cnpj) {
			throw new Error('Este e-mail já está cadastrado para outro CPF/CNPJ');
		}

		// O CPF/CNPJ informado nunca é gravado numa conta que já é de outra
		// pessoa só porque o e-mail bateu: equipe da corretora (dono, admin...)
		// não é completada por este fluxo. Só completa cadastros de produtor
		// antigos, feitos quando o CPF/CNPJ ainda não era gravado.
		const isStaff = byEmail.members.some(
			(member) => member.role !== Role.producer,
		);

		if (isStaff) {
			throw new Error(
				'Este e-mail pertence a um usuário da equipe da corretora. Use o e-mail do produtor.',
			);
		}

		await ctx.database.user.update({
			where: { id: byEmail.id },
			data: { ...document, ...(!byEmail.phone && { phone }) },
		});

		return { userId: byEmail.id, created: false };
	}

	let userId: string;

	try {
		const { user } = await ctx.auth.api.createUser({
			body: {
				name,
				email,
				password: Bun.randomUUIDv7(),
				// @ts-expect-error
				role: Role.customer,
			},
		});

		userId = user.id;
	} catch (error) {
		throw friendlyAuthError(error);
	}

	try {
		await ctx.database.user.update({
			where: { id: userId },
			data: { ...document, phone },
		});
	} catch (error) {
		await ctx.database.user.delete({ where: { id: userId } });

		throw error;
	}

	return { userId, created: true };
}

export { findOrCreateProducerUser };
