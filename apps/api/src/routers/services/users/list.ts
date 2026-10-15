import {
	assignableStaffRoles,
	canManageStaffRole,
	type StaffRole,
	type UserList,
} from '@segwise/core';
import { Role, StatusInvitation } from '@segwise/database/enums';
import type { Server } from '@/@types/server';
import {
	type ParsedSearch,
	parseSearch,
} from '@/functions/search/parse-search';
import { getUsersActor } from '@/functions/users/context';

function userSearchConditions(parsed: ParsedSearch) {
	if (parsed.kind === 'document') {
		return [{ cpf: parsed.digits }];
	}

	if (parsed.kind === 'phone') {
		return [{ phone: { contains: parsed.digits } }];
	}

	if (parsed.kind === 'email') {
		return [{ email: { startsWith: parsed.email } }];
	}

	return [{ name: { contains: parsed.text, mode: 'insensitive' as const } }];
}

function registerRoutersServicesUsersList(server: Server) {
	server.get('/', async (ctx) => {
		const actor = getUsersActor(ctx);

		if (!actor) {
			return ctx.json({ message: 'Sem permissão para ver usuários' }, 403);
		}

		const search = ctx.req.query('search')?.trim();
		const parsed = search ? parseSearch(search) : null;

		const [members, invitations] = await Promise.all([
			ctx.database.member.findMany({
				// O próprio usuário nunca volta: ele não se gerencia por aqui.
				where: {
					brokerId: actor.brokerId,
					role: { not: Role.producer },
					userId: { not: actor.userId },
					...(parsed && { user: { OR: userSearchConditions(parsed) } }),
				},
				select: {
					id: true,
					role: true,
					status: true,
					createdAt: true,
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							cpf: true,
							phone: true,
						},
					},
				},
			}),
			ctx.database.invitation.findMany({
				where: {
					brokerId: actor.brokerId,
					status: StatusInvitation.pending,
					role: { not: Role.producer },
				},
				select: {
					id: true,
					email: true,
					role: true,
					createdAt: true,
					expiresAt: true,
				},
			}),
		]);

		const invitedUsers = invitations.length
			? await ctx.database.user.findMany({
					where: { email: { in: invitations.map((item) => item.email) } },
					select: { email: true, name: true, phone: true },
				})
			: [];

		const invitedByEmail = new Map(invitedUsers.map((u) => [u.email, u]));

		const matchesInvitation = (email: string) => {
			if (!parsed) {
				return true;
			}

			const invited = invitedByEmail.get(email);

			if (parsed.kind === 'email') {
				return email.toLowerCase().startsWith(parsed.email);
			}

			if (parsed.kind === 'text') {
				return !!invited?.name
					?.toLowerCase()
					.includes(parsed.text.toLowerCase());
			}

			return !!invited?.phone?.includes(parsed.digits);
		};

		const items: UserList['items'] = [
			...members.map((member) => ({
				id: member.id,
				origin: 'active' as const,
				name: member.user.name,
				email: member.user.email,
				cpf: member.user.cpf,
				phone: member.user.phone,
				role: member.role as StaffRole,
				status: member.status,
				createdAt: member.createdAt.toISOString(),
				expiresAt: null,
				canManage: canManageStaffRole(actor.role, member.role),
			})),
			...invitations
				.filter((invitation) => matchesInvitation(invitation.email))
				.map((invitation) => ({
					id: invitation.id,
					origin: 'pending' as const,
					name: invitedByEmail.get(invitation.email)?.name ?? null,
					email: invitation.email,
					cpf: null,
					phone: invitedByEmail.get(invitation.email)?.phone ?? null,
					role: invitation.role as StaffRole,
					status: 'pending' as const,
					createdAt: invitation.createdAt.toISOString(),
					expiresAt: invitation.expiresAt.toISOString(),
					canManage: canManageStaffRole(actor.role, invitation.role),
				})),
		].sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

		return ctx.json(
			{
				viewerRole: actor.role,
				assignableRoles: assignableStaffRoles(actor.role),
				items,
			} satisfies UserList,
			200,
		);
	});
}

export { registerRoutersServicesUsersList };
