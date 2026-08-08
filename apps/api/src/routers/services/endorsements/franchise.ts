import { zValidator } from '@hono/zod-validator';
import { SchemaEndorsementFranchise } from '@segwise/core/schemas';
import type { Server } from '@/@types/server';
import { EndorsementType } from '@/generated/prisma/enums';

function registerRoutersServicesEndorsementsFranchise(server: Server) {
	server.post(
		'/franchise',
		zValidator('json', SchemaEndorsementFranchise),
		async (ctx) => {
			const id = ctx.req.param('id');
			const type = EndorsementType.franchise;

			console.log(id);

			const { franchise, amount, percentage } = ctx.req.valid('json');

			const commission = amount * (percentage / 100);

			if (!id) {
				return ctx.json(
					{
						message: 'ID do seguro não informado',
					},
					409,
				);
			}

			console.log(
				await ctx.database.safe.findUnique({
					where: {
						id,
					},
				}),
			);

			console.log({
				safeId: id,
				type,
				franchise,
				amount,
				percentage,
				commission: commission || null,
			});

			await ctx.database.endorsement.create({
				data: {
					safeId: id,
					type,
					franchise,
					amount,
					percentage,
					commission: commission || null,
				},
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
