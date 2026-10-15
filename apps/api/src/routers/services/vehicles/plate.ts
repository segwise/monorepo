import { zValidator } from '@hono/zod-validator';
import { SchemaPlate } from '@segwise/core/schemas';
import z from 'zod';
import type { Server } from '@/@types/server.d';
import { vehicleByPlate } from '@/functions/vehicle/by-plate';

function registerRoutersServicesVehiclesPlate(server: Server) {
	server.get(
		'/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}',
		zValidator(
			'param',
			z.object(
				{
					plate: SchemaPlate,
				},
				'Parâmetros de consulta inválidos',
			),
		),
		async (ctx) => {
			const { plate } = ctx.req.valid('param');

			const vehicle = await vehicleByPlate(plate);

			return ctx.json(vehicle, 200);
		},
	);
}

export { registerRoutersServicesVehiclesPlate };
