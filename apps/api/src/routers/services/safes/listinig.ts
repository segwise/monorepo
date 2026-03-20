import { zValidator } from '@hono/zod-validator';
import { SchemaSearchQueriesSafeSimple } from '@segwise/core/schemas';
import type { ResponseDataCursor, SafeSimple } from '@segwise/core/types';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/safe/simple';
import { serializer } from '@/db-serializers/safe/simple';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesSafesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchQueriesSafeSimple),
		async (ctx) => {
			const { ids, registrations, limit } = ctx.req.valid('query');

			const where: Prisma.SafeWhereInput = {
				...(!!ids?.length && {
					id: {
						in: ids,
					},
				}),
				...(!!registrations?.length && {
					insured: {
						cpf: {
							in: registrations,
						},
					},
				}),
			};

			const safes = await ctx.database.safe.findMany({
				where,
				...(limit && {
					take: limit,
				}),
				select: selectPrisma,
				relationLoadStrategy: 'join',
			});

			return ctx.json(
				{
					data: safes.map(serializer),
					next: null,
					previous: null,
				} satisfies ResponseDataCursor<SafeSimple>,
				200,
			);
		},
	);
}

export { registerRoutersServicesSafesSimpleListining };
