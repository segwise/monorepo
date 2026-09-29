import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsProducerPending } from '@segwise/core/schemas';
import type { ProducerPending } from '@segwise/core/types';
import type { Server } from '@/@types/server.d';
import { Role, StatusInvitation } from '@/generated/prisma/enums';

function registerRoutersServicesProducersPending(server: Server) {
	server.get(
		'/pending',
		zValidator('query', SchemaSearchParamsProducerPending),
		async (ctx) => {
			const { kind } = ctx.req.valid('query');

			const brokerId =
				ctx?.session?.brokerId ||
				(await ctx.database.broker
					.findFirst({
						orderBy: { createdAt: 'asc' },
						select: { id: true },
					})
					.then((response) => response?.id));

			const invitations = await ctx.database.invitation.findMany({
				where: {
					brokerId,
					role: Role.producer,
					status: StatusInvitation.pending,
					...(kind === 'partner' && { typeOfProduction: { not: null } }),
					...(kind === 'producer' && { typeOfProduction: null }),
				},
				select: {
					id: true,
					email: true,
					referral: true,
					typeOfProduction: true,
					percentageOfProduction: true,
					typeOfProductionPayment: true,
					startOfProductionPayment: true,
					createdAt: true,
					expiresAt: true,
				},
				orderBy: { createdAt: 'desc' },
			});

			const emails = Array.from(
				new Set(invitations.map((props) => props.email)),
			);

			const users = emails.length
				? await ctx.database.user.findMany({
						where: { email: { in: emails } },
						select: { email: true, name: true, phone: true },
					})
				: [];

			const usersByEmail = new Map(
				users.map((user) => [user.email, user] as const),
			);

			const producers: ProducerPending[] = invitations.map((invitation) => {
				const user = usersByEmail.get(invitation.email);

				return {
					id: invitation.id,
					kind: invitation.typeOfProduction ? 'partner' : 'producer',
					name: user?.name ?? null,
					email: invitation.email,
					phone: user?.phone ?? null,
					referral: invitation.referral,
					typeOfProduction: invitation.typeOfProduction,
					percentageOfProduction: invitation.percentageOfProduction,
					typeOfProductionPayment: invitation.typeOfProductionPayment,
					startOfProductionPayment: invitation.startOfProductionPayment,
					invitedAt: invitation.createdAt.toISOString(),
					expiresAt: invitation.expiresAt.toISOString(),
				};
			});

			return ctx.json(producers, 200);
		},
	);
}

export { registerRoutersServicesProducersPending };
