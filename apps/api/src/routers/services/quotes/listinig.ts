import { zValidator } from '@hono/zod-validator';
import { SchemaSearchQueriesQuoteSimple } from '@segwise/core/schemas';
import type { QuoteSimple, ResponseDataCursor } from '@segwise/core/types';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/quote/simple';
import { serializer } from '@/db-serializers/quote/simple';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesQuotesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchQueriesQuoteSimple),
		async (ctx) => {
			const { limit } = ctx.req.valid('query');

			const where: Prisma.QuoteWhereInput = {};

			const quotes = await ctx.database.quote.findMany({
				where,
				...(limit && {
					take: limit,
				}),
				select: selectPrisma,
				relationLoadStrategy: 'join',
			});

			return ctx.json(
				{
					data: quotes.map(serializer),
					next: null,
					previous: null,
				} satisfies ResponseDataCursor<QuoteSimple>,
				200,
			);
		},
	);

	server.get('/simple/plate/:plate', async (ctx) => {
		const { plate } = ctx.req.param();

		const where: Prisma.QuoteWhereInput = {
			quoteVehicle: {
				vehicle: {
					OR: [
						{
							plate: plate,
						},
						{
							plateAlternative: plate,
						},
					],
				},
			},
		};

		const quote = await ctx.database.quote.findFirst({
			where,
			select: selectPrisma,
			relationLoadStrategy: 'join',
		});

		if (!quote) {
			return ctx.json(
				{
					message: 'Cotação não encontrada',
				},
				404,
			);
		}

		return ctx.json(serializer(quote), 200);
	});
}

export { registerRoutersServicesQuotesSimpleListining };
