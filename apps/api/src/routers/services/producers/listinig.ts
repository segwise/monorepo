import type { Server } from '@/@types/server.d';
import { Role } from '@/generated/prisma/enums';
import { selectPrisma } from '@/libraries/database/adapters/producer/simple';
import { serializer } from '@/libraries/database/serializers/producer/simple';

function registerRoutersServicesProducersSimpleListining(server: Server) {
	server.get('/simple', async (ctx) => {
		const brokerId = ctx.session.brokerId;

		const producers = await ctx.database.user.findMany({
			where: {
				...(!!brokerId && {
					role: Role.customer,
					members: {
						some: {
							brokerId: brokerId,
							role: Role.producer,
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
