import { zValidator } from '@hono/zod-validator';
import { SchemaEndorsementCancel } from '@segwise/core/schemas';
import type { Server } from '@/@types/server';
import { captureEndorsementState } from '@/functions/endorsements/snapshot';

import { EndorsementType, StatusSafe } from '@segwise/database/enums';

const CANCELED_BY_ENDORSEMENT_MESSAGE = 'Cancelado por endosso';

function registerRoutersServicesEndorsementsCancel(server: Server) {
	server.post(
		'/cancel',
		zValidator('json', SchemaEndorsementCancel),
		async (ctx) => {
			const id = ctx.req.param('id');
			const type = EndorsementType.cancellation;

			const { effectivedAt } = ctx.req.valid('json');

			if (!id) {
				return ctx.json(
					{
						message: 'ID do seguro não informado',
					},
					409,
				);
			}

			const isCancel = await ctx.database.safe
				.findUnique({
					where: {
						id,
					},
					select: {
						status: true,
					},
				})
				.then((response) => response?.status === StatusSafe.canceled);

			if (isCancel) {
				return ctx.json(
					{
						message: 'Seguro já está cancelado',
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
						status: StatusSafe.canceled,
						statusAt: effectivedAt,
						canceledAt: effectivedAt,
						statusMessage: CANCELED_BY_ENDORSEMENT_MESSAGE,
					},
				});

				await transaction.endorsement.create({
					data: {
						safeId: id,
						type,
						effectivedAt,
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
					message: 'Endosso de cancelamento registrado',
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesEndorsementsCancel };
