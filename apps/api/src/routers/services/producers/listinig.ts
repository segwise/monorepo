import type { Server } from '@/@types/server.d';
import { Role, RoleMember } from '@/generated/prisma/enums';
import { selectPrisma } from '@/libraries/database/adapters/producer/simple';
import { serializer } from '@/libraries/database/serializers/producer/simple';

function registerRoutersServicesProducersSimpleListining(server: Server) {
	server.get('/simple', async (ctx) => {
		const brokerId = ctx.session.brokerId;

		const producers = await ctx.database.user.findMany({
			where: {
				...(!brokerId && {
					role: Role.producer,
				}),
				...(!!brokerId && {
					role: Role.customer,
					members: {
						some: {
							id: brokerId,
							role: RoleMember.producer,
						},
					},
				}),
			},
			select: selectPrisma,
			orderBy: {
				name: 'asc',
			},
		});

		return ctx.json(
			producers.map((props) =>
				serializer(props, {
					storage: ctx.storage.images,
				}),
			),
			200,
		);
	});
}

export { registerRoutersServicesProducersSimpleListining };
