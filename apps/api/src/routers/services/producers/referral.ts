import { zValidator } from '@hono/zod-validator';
import { SchemaProducerReferral } from '@segwise/core';
import type { Server } from '@/@types/server';

function registerRoutersServicesProducersReferral(server: Server) {
	server.get(
		'/referral/:referral',
		zValidator('param', SchemaProducerReferral),
		async (ctx) => {
			const { referral } = ctx.req.valid('param');

			const producer = await ctx.database.user.findUnique({
				where: {
					referral,
				},
				select: {
					id: true,
					referral: true,
				},
			});

			if (!producer) {
				return ctx.json(
					{
						message: 'Código de indicação não encontrado!',
					},
					404,
				);
			}

			return ctx.json(
				{
					userId: producer.id,
					referral: producer.referral,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesProducersReferral };
