import { zValidator } from '@hono/zod-validator';
import { SchemaEndorsementFranchise } from '@segwise/core/schemas';
import { EndorsementType } from '@segwise/database/enums';
import type { Server } from '@/@types/server';
import { captureEndorsementState } from '@/functions/endorsements/snapshot';

function registerRoutersServicesEndorsementsFranchise(server: Server) {
	server.post(
		'/franchise',
		zValidator('json', SchemaEndorsementFranchise),
		async (ctx) => {
			const id = ctx.req.param('id');
			const type = EndorsementType.franchise;

			const { franchise, amount, percentage } = ctx.req.valid('json');

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
						franchise,
					},
				});

				await transaction.endorsement.create({
					data: {
						safeId: id,
						type,
						franchise,
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
					message: 'Endosso de frânquia registrado',
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesEndorsementsFranchise };
