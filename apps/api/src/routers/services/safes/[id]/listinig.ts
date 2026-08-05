import type { Server } from '@/@types/server';
import { selectPrisma } from '@/libraries/database/adapters/safe/details';
import { serializer } from '@/libraries/database/serializers/safe/details';

function registerRoutersServicesSafesByIdListining(server: Server) {
	server.get('/', async (ctx) => {
		const id = ctx.req.param('id');

		const response = await ctx.database.safe.findUnique({
			where: {
				id,
			},
			select: selectPrisma,
		});

		if (!response) {
			return ctx.json(
				{
					message: 'Seguro não encontrado',
				},
				401,
			);
		}

		return ctx.json(serializer(response), 200);
	});
}

export { registerRoutersServicesSafesByIdListining };
