import { zValidator } from '@hono/zod-validator';
import { maskPlate } from '@segwise/core/masks';
import { SchemaPlate } from '@segwise/core/schemas';
import z from 'zod';
import type { Server } from '@/@types/server.d';

function registerRoutersVehiclesPlate(server: Server) {
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

			return ctx.json(
				{
					plate: maskPlate(plate),
					alternative: maskPlate(plate),
					vehicle: {
						model: '',
					},
				},
				200,
			);
		},
	);
}

export { registerRoutersVehiclesPlate };
