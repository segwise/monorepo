import { zValidator } from '@hono/zod-validator';
import {
	SchemaSearchParamsSafeRegistration,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core/schemas';
import type { ResponseDataCursor, SafeSimple } from '@segwise/core/types';
import { set } from 'date-fns';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/safe/simple';
import { serializer } from '@/db-serializers/safe/simple';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesSafesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchParamsSafeSimple),
		async (ctx) => {
			const { ids, limit } = ctx.req.valid('query');

			const where: Prisma.SafeWhereInput = {
				...(!!ids?.length && {
					id: {
						in: ids,
					},
				}),
			};

			const [safes, total] = await ctx.database.$transaction([
				ctx.database.safe.findMany({
					where,
					...(limit && {
						take: limit,
					}),
					select: selectPrisma,
					relationLoadStrategy: 'join',
				}),
				ctx.database.safe.count({
					where,
				}),
			]);

			return ctx.json(
				{
					data: safes.map(serializer),
					total,
					next: null,
					previous: null,
				} satisfies ResponseDataCursor<SafeSimple>,
				200,
			);
		},
	);

	server.get(
		'/simple/registration',
		zValidator(
			'query',
			SchemaSearchParamsSafeRegistration.transform(
				({ registration, birth }) => ({
					registration,
					birth: set(birth, {
						hours: 12,
					}),
				}),
			),
		),
		async (ctx) => {
			const { registration, birth } = ctx.req.valid('query');

			const safes = await ctx.database.safe.findMany({
				where: {
					insured: {
						cpf: registration,
						birth: {
							lte: birth,
							gte: birth,
						},
					},
				},
				select: selectPrisma,
				relationLoadStrategy: 'join',
			});

			if (!safes) {
				return ctx.json(
					{
						message: 'Seguros não encontrados',
					},
					404,
				);
			}

			return ctx.json(safes.map(serializer), 200);
		},
	);
}

export { registerRoutersServicesSafesSimpleListining };
