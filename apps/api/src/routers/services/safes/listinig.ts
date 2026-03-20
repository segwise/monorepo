import { zValidator } from '@hono/zod-validator';
import {
	SchemaSearchQueriesSafeRegistration,
	SchemaSearchQueriesSafeSimple,
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
		zValidator('query', SchemaSearchQueriesSafeSimple),
		async (ctx) => {
			const { ids, registrations, excludes, limit } = ctx.req.valid('query');

			const where: Prisma.SafeWhereInput = {
				...(!!ids?.length && {
					id: {
						in: ids,
						...(!!excludes?.length && {
							notIn: excludes,
						}),
					},
				}),
				...(!ids?.length &&
					!!excludes?.length && {
						id: {
							...(!!excludes?.length && {
								notIn: excludes,
							}),
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

	server.get(
		'/simple/registration',
		zValidator(
			'query',
			SchemaSearchQueriesSafeRegistration.transform(
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

			const insured = await ctx.database.insured.findFirst({
				where: {
					cpf: registration,
					birth: {
						lte: birth,
						gte: birth,
					},
				},
				select: {
					id: true,
				},
			});

			if (!insured) {
				return ctx.json(
					{
						message: 'Segurado não encontrado',
					},
					404,
				);
			}

			return ctx.json(
				{
					message: '',
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesSafesSimpleListining };
