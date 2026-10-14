import { zValidator } from '@hono/zod-validator';
import { SchemaEndorsementAddress } from '@segwise/core/schemas';
import type { Server } from '@/@types/server';
import { captureEndorsementState } from '@/functions/endorsements/snapshot';

import { EndorsementType } from '@/generated/prisma/enums';

function registerRoutersServicesEndorsementsAddress(server: Server) {
	server.post(
		'/address',
		zValidator('json', SchemaEndorsementAddress),
		async (ctx) => {
			const id = ctx.req.param('id');
			const type = EndorsementType.address;

			const { postalCode, amount, percentage } = ctx.req.valid('json');

			const commission = percentage ? amount * (percentage / 100) : null;

			if (!id) {
				return ctx.json(
					{
						message: 'ID do seguro não informado',
					},
					409,
				);
			}

			await ctx.database.$transaction(async (transaction) => {
				const before = await captureEndorsementState(transaction, id, type);

				await transaction.safe.update({
					where: {
						id,
					},
					data: {
						safeVehicle: {
							update: {
								overnightPostalCode: postalCode,
							},
						},
					},
				});

				await transaction.endorsement.create({
					data: {
						safeId: id,
						type,
						overnightPostalCode: postalCode,
						amount,
						percentage,
						commission,
						createdAt: new Date(),
						snapshot: {
							before,
							after: await captureEndorsementState(transaction, id, type),
						},
					},
				});
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
