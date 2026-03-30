import type { Server } from '@/@types/server.d';

import { selectPrisma } from '@/db-adapters/producers/simple';
import { serializer } from '@/db-serializers/producers/simple';
import { Role } from '@/generated/prisma/enums';

function registerRoutersServicesProducersSimpleListining(server: Server) {
	server.get('/simple', async (ctx) => {
		const producers = await ctx.database.user.findMany({
			where: {
				role: Role.producer,
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
