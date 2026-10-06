import { zValidator } from '@hono/zod-validator';
import {
	assignableStaffRoles,
	canManageStaffRole,
	SchemaUserStatus,
	SchemaUserUpdate,
} from '@segwise/core';
import type { Server } from '@/@types/server';
import { getUsersActor } from '@/functions/users/context';
import { assertCpfAvailable } from '@/functions/users/cpf';
import { Role, StatusMember } from '@/generated/prisma/enums';

function registerRoutersServicesUsersUpdate(server: Server) {
	// Alterar nome, celular e perfil de um membro da equipe.
	server.patch('/:id', zValidator('json', SchemaUserUpdate), async (ctx) => {
		const actor = getUsersActor(ctx);

		if (!actor) {
			return ctx.json({ message: 'Sem permissão para alterar usuários' }, 403);
		}

		const { name, cpf, phone, role } = ctx.req.valid('json');

		const member = await ctx.database.member.findFirst({
			where: {
				id: ctx.req.param('id'),
				brokerId: actor.brokerId,
				role: { not: Role.producer },
			},
			select: { id: true, role: true, userId: true, status: true },
		});

		if (!member) {
			return ctx.json({ message: 'Usuário não encontrado' }, 404);
		}

		if (member.status === StatusMember.deleted) {
			return ctx.json(
				{
					message: 'Usuário excluído: cadastre o e-mail de novo para restaurar',
				},
				409,
			);
		}

		if (member.userId === actor.userId) {
			return ctx.json(
				{ message: 'Você não pode alterar o seu próprio perfil por aqui' },
				403,
			);
		}

		// Precisa estar acima de quem é alterado e só pode atribuir perfil abaixo
		// do seu: não dá para rebaixar quem é superior nem promover além de si.
		if (
			!canManageStaffRole(actor.role, member.role) ||
			!assignableStaffRoles(actor.role).includes(role)
		) {
			return ctx.json(
				{ message: 'Você não tem permissão para esta alteração' },
				403,
			);
		}

		try {
			await assertCpfAvailable(ctx, cpf, member.userId);
		} catch (error) {
			return ctx.json(
				{ message: error instanceof Error ? error.message : 'CPF inválido' },
				409,
			);
		}

		await ctx.database.$transaction([
			ctx.database.user.update({
				where: { id: member.userId },
				data: { name, cpf, phone: phone || null },
			}),
			ctx.database.member.update({
				where: { id: member.id },
				data: { role },
			}),
		]);

		return ctx.json({ message: 'Usuário atualizado com sucesso' }, 200);
	});

	// Suspender ou reativar. Suspenso perde o acesso na hora (a sessão é ignorada).
	server.patch(
		'/:id/status',
		zValidator('json', SchemaUserStatus),
		async (ctx) => {
			const actor = getUsersActor(ctx);

			if (!actor) {
				return ctx.json(
					{ message: 'Sem permissão para alterar usuários' },
					403,
				);
			}

			const { status } = ctx.req.valid('json');

			const member = await ctx.database.member.findFirst({
				where: {
					id: ctx.req.param('id'),
					brokerId: actor.brokerId,
					role: { not: Role.producer },
				},
				select: { id: true, role: true, userId: true, status: true },
			});

			if (!member) {
				return ctx.json({ message: 'Usuário não encontrado' }, 404);
			}

			if (member.status === StatusMember.deleted) {
				return ctx.json(
					{
						message:
							'Usuário excluído: cadastre o e-mail de novo para restaurar',
					},
					409,
				);
			}

			if (
				member.userId === actor.userId ||
				!canManageStaffRole(actor.role, member.role)
			) {
				return ctx.json(
					{ message: 'Você não tem permissão para esta alteração' },
					403,
				);
			}

			await ctx.database.member.update({
				where: { id: member.id },
				data: { status },
			});

			return ctx.json(
				{
					message:
						status === 'suspended' ? 'Usuário suspenso' : 'Usuário reativado',
				},
				200,
			);
		},
	);

	// Exclusão LÓGICA: o vínculo e tudo ligado a ele ficam no banco; só o acesso
	// é encerrado. Cadastrar o mesmo e-mail de novo restaura.
	server.delete('/:id', async (ctx) => {
		const actor = getUsersActor(ctx);

		if (!actor) {
			return ctx.json({ message: 'Sem permissão para excluir usuários' }, 403);
		}

		const member = await ctx.database.member.findFirst({
			where: {
				id: ctx.req.param('id'),
				brokerId: actor.brokerId,
				role: { not: Role.producer },
			},
			select: { id: true, role: true, userId: true, status: true },
		});

		if (!member) {
			return ctx.json({ message: 'Usuário não encontrado' }, 404);
		}

		if (
			member.userId === actor.userId ||
			!canManageStaffRole(actor.role, member.role)
		) {
			return ctx.json(
				{ message: 'Você não tem permissão para esta alteração' },
				403,
			);
		}

		await ctx.database.member.update({
			where: { id: member.id },
			data: { status: StatusMember.deleted },
		});

		return ctx.json({ message: 'Usuário excluído' }, 200);
	});
}

export { registerRoutersServicesUsersUpdate };
