import { zValidator } from '@hono/zod-validator';
import { SchemaEndorsementCancel } from '@segwise/core/schemas';
import type { Server } from '@/@types/server';
import { EndorsementType, StatusSafe } from '@/generated/prisma/enums';

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

			await ctx.database.safe.update({
				where: {
					id,
				},
				data: {
					status: StatusSafe.canceled,
					endorsements: {
						create: {
							safeId: id,
							type,
							effectivedAt,
						},
					},
				},
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
