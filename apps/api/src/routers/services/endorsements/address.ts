import { zValidator } from '@hono/zod-validator';
import { SchemaEndorsementAddress } from '@segwise/core/schemas';
import type { Server } from '@/@types/server';
import { EndorsementType } from '@/generated/prisma/enums';

function registerRoutersServicesEndorsementsAddress(server: Server) {
	server.post(
		'/address',
		zValidator('json', SchemaEndorsementAddress),
		async (ctx) => {
			const id = ctx.req.param('id');
			const type = EndorsementType.address;

			const { postalCode, amount, percentage } = ctx.req.valid('json');

			const commission = amount * (percentage / 100);

			if (!id) {
				return ctx.json(
					{
						message: 'ID do seguro não informado',
					},
					409,
				);
			}

			await ctx.database.safe.update({
				where: {
					id,
				},
				data: {
					safeVehicle: {
						update: {
							overnightPostalCode: postalCode,
						},
					},
					endorsements: {
						create: {
							type,
							overnightPostalCode: postalCode,
							amount,
							percentage,
							commission: commission || null,
						},
					},
				},
			});

			return ctx.json(
				{
					message: 'Endosso de endereço registrado',
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesEndorsementsAddress };
