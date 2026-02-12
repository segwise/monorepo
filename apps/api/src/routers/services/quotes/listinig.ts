import { zValidator } from '@hono/zod-validator';
import {
	type QuoteSimple,
	type ResponseDataCursor,
	SchemaSearchQueriesQuoteSimple,
} from '@segwise/core';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/quote/simple';
import { serializer } from '@/db-serializers/quote/simple';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesQuotesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchQueriesQuoteSimple),
		async (ctx) => {
			const { producer, name, limit, type, status, requestAt } =
				ctx.req.valid('query');

			const where: Prisma.QuoteWhereInput = {};

			if (producer) {
			}

			if (type) {
				where.type = type;
			}

			if (status) {
				where.status = status;
			}

			if (name && where.temporaryInsured) {
				if (!where.temporaryInsured) {
					where.temporaryInsured = {};
				}

				where.temporaryInsured.name = name;
			}

			if (requestAt) {
				where.requestAt = {};
			}

			const quotes = await ctx.database.quote.findMany({
				where,
				take: limit,
				select: selectPrisma,
				relationLoadStrategy: 'join',
			});

			return ctx.json(
				{
					data: quotes.map(serializer),
					next: null,
					previous: null,
					pages: {
						1: '',
					},
				} satisfies ResponseDataCursor<QuoteSimple>,
				200,
			);
		},
	);
}

export { registerRoutersServicesQuotesSimpleListining };
