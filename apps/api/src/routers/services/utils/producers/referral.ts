import { zValidator } from '@hono/zod-validator';
import { SchemaProducerReferral } from '@segwise/core';
import type { Server } from '@/@types/server';

function registerRoutersServicesUtilsProducersReferral(server: Server) {
	server.get(
		'/referral/:referral',
		zValidator('param', SchemaProducerReferral),
		async (ctx) => {
			const { referral } = ctx.req.valid('param');

			const producer = await ctx.database.member.findUnique({
				where: {
					referral,
				},
				select: {
					referral: true,
					userId: true,
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
					userId: producer.userId,
					referral: producer.referral,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesUtilsProducersReferral };
