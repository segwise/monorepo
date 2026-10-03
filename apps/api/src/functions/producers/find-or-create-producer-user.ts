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
// - Reaproveita o usuário que já existe por CPF/CNPJ ou por e-mail.
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

	const existing = await ctx.database.user.findFirst({
		where: { OR: [{ cpf: cpfOrCnpj }, { cnpj: cpfOrCnpj }, { email }] },
		select: { id: true, email: true, cpf: true, cnpj: true, phone: true },
	});

	if (existing) {
		const sameDocument =
			existing.cpf === cpfOrCnpj || existing.cnpj === cpfOrCnpj;

		if (existing.email !== email) {
			throw new Error(
				`Este CPF/CNPJ já está cadastrado com o e-mail ${existing.email}. Use o mesmo e-mail.`,
			);
		}

		if (!sameDocument && (existing.cpf || existing.cnpj)) {
			throw new Error('Este e-mail já está cadastrado para outro CPF/CNPJ');
		}

		// Cadastro antigo sem documento/celular: completa o que faltar.
		if (!sameDocument || !existing.phone) {
			await ctx.database.user.update({
				where: { id: existing.id },
				data: {
					...(!sameDocument && document),
					...(!existing.phone && { phone }),
				},
			});
		}

		return { userId: existing.id, created: false };
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
