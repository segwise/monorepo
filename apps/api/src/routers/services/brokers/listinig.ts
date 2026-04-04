import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsBrokerSimple } from '@segwise/core';
import type { Server } from '@/@types/server.d';
import type { Prisma } from '@/generated/prisma/client';
import { selectPrisma as selectPrismaSimple } from '@/libraries/database/adapters/broker/simple';
import { serializer as serializerSimple } from '@/libraries/database/serializers/broker/simple';

function registerRoutersServicesBrokersListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchParamsBrokerSimple),
		async (ctx) => {
			const { search } = ctx.req.valid('query');

			const where: Prisma.BrokerWhereInput = {
				...(!!search && {
					name: {
						search: search.replaceAll(' ', '&'),
						mode: 'insensitive',
					},
				}),
			};

			const brokers = await ctx.database.broker.findMany({
				where,
				select: selectPrismaSimple,
				orderBy: {
					name: 'asc',
				},
				relationLoadStrategy: 'join',
			});

			const data = brokers.map((props) =>
				serializerSimple(props, {
					storage: ctx.storage.images,
				}),
			);

			return ctx.json(data, 200);
		},
	);
}

export { registerRoutersServicesBrokersListining };
