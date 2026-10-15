import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/vehicle/manufacturer';
import { serializer } from '@/db-serializers/vehicle/manufacturer';

function registerRoutersServicesVehiclesManufacturers(server: Server) {
	server.get('/manufacturers', async (ctx) => {
		const results = await ctx.database.manufacturerVehicle.findMany({
			select: selectPrisma,
			relationLoadStrategy: 'join',
		});

		return ctx.json(
			results.map((props) =>
				serializer(props, {
					storage: ctx.storage.images,
				}),
			),
			200,
		);
	});
}

export { registerRoutersServicesVehiclesManufacturers };
