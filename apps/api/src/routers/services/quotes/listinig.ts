import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsQuoteSimple } from '@segwise/core/schemas';
import {
	endOfDay,
	endOfMonth,
	endOfToday,
	startOfDay,
	startOfMonth,
	startOfToday,
} from 'date-fns';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/quote/simple';
import { serializer } from '@/db-serializers/quote/simple';
import type { Prisma } from '@/generated/prisma/client';
import { serializerCursor } from '@/libraries/database/serializers/cursor';

function registerRoutersServicesQuotesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchParamsQuoteSimple),
		async (ctx) => {
			const {
				cursor,
				limit,
				search,
				producers,
				insuranceCompanies,
				requestAt,
				modality,
				status,
				renewal,
			} = ctx.req.valid('query');

			const pageMargins = 2;

			const where: Prisma.QuoteWhereInput = {
				...(!!renewal && {
					renewal,
				}),
				...(!!search && {
					OR: [
						{
							insured: {
								name: {
									search: search.replaceAll(' ', '&'),
									mode: 'insensitive',
								},
							},
						},
						{
							temporaryInsured: {
								name: {
									search: search.replaceAll(' ', '&'),
									mode: 'insensitive',
								},
							},
						},
					],
				}),
				...(!!producers?.length && {
					producerId: {
						in: producers,
					},
				}),
				...(!!insuranceCompanies?.length && {
					insuranceCompanyId: {
						in: insuranceCompanies,
					},
				}),
				...(!requestAt && {
					requestAt: {
						gte: startOfMonth(startOfToday()),
						lte: endOfMonth(endOfToday()),
					},
				}),
				...(!!requestAt &&
					typeof requestAt === 'string' && {
						requestAt: {
							gte: startOfDay(requestAt),
							lte: endOfDay(requestAt),
						},
					}),
				...(!!requestAt &&
					typeof requestAt === 'object' && {
						requestAt: {
							gte: startOfDay(requestAt.start),
							lte: endOfDay(requestAt.end),
						},
					}),
				...(!!modality && {
					modality: {
						in: modality,
					},
				}),
				...(!!status && {
					status: {
						in: status,
					},
				}),
			};

			const [quotes, total, itemsBefore] = await ctx.database.$transaction([
				ctx.database.quote.findMany({
					where,
					...(cursor && {
						cursor: {
							id: cursor,
						},
					}),
					take: (limit as number) + 1,
					orderBy: {
						id: 'desc',
					},
					select: selectPrisma,
					relationLoadStrategy: 'join',
				}),
				ctx.database.quote.count({ where }),
				cursor
					? ctx.database.quote.count({
							where: {
								...where,
								id: { gt: cursor },
							},
						})
					: ctx.database.quote.count({
							where: {
								...where,
								id: { in: [] },
							},
							take: 0,
						}),
			]);

			const currentPage = cursor
				? Math.floor(itemsBefore / (limit as number)) + 1
				: 1;

			const totalPages = Math.ceil(total / (limit as number));

			const nextCursor = quotes[limit as number]?.id || null;

			let previousCursor = !quotes.length
				? null
				: !cursor
					? null
					: (await ctx.database.quote
							.findFirst({
								where,
								cursor: {
									id: quotes[0]?.id,
								},
								orderBy: {
									id: 'asc',
								},
								skip: limit as number,
								select: {
									id: true,
								},
								relationLoadStrategy: 'join',
							})
							.then((response) => response?.id)) || null;

			if (cursor === previousCursor) {
				previousCursor = null;
			}

			const pages: Record<
				number | 'first' | 'last' | 'count',
				string | number | null
			> = {
				first: null,
				last: null,
				count: totalPages,
			};

			pages[currentPage] = currentPage === 1 ? null : (cursor as string);

			let tempCursorForward = nextCursor;
			for (let i = 1; i <= pageMargins; i++) {
				if (!tempCursorForward) break;

				const pageNum = currentPage + i;
				pages[pageNum] = tempCursorForward;

				if (i < pageMargins) {
					const batchForward = await ctx.database.quote.findFirst({
						where,
						cursor: { id: tempCursorForward },
						skip: limit as number,
						orderBy: { id: 'desc' },
						select: { id: true },
						relationLoadStrategy: 'join',
					});

					tempCursorForward = batchForward?.id || null;
				}
			}

			if (currentPage > 1 && previousCursor) {
				const pageNumPrev1 = currentPage - 1;

				pages[pageNumPrev1] = pageNumPrev1 === 1 ? null : previousCursor;

				let tempCursorBackward = previousCursor;
				const maxBack = Math.min(pageMargins, currentPage - 1);

				for (let d = 2; d <= maxBack; d++) {
					const batchBackward = await ctx.database.quote.findFirst({
						where,
						cursor: { id: tempCursorBackward },
						skip: limit as number,
						orderBy: { id: 'asc' },
						select: { id: true },
						relationLoadStrategy: 'join',
					});

					const furtherPrev = batchBackward?.id || null;
					if (!furtherPrev) break;

					const pageNum = currentPage - d;

					pages[pageNum] = pageNum === 1 ? null : furtherPrev;

					tempCursorBackward = furtherPrev;
				}
			}

			const skipGetLastPage = (total % (limit as number)) - 1;

			const lastPage = await ctx.database.quote.findFirst({
				where,
				orderBy: { id: 'asc' },
				skip: skipGetLastPage >= 0 ? skipGetLastPage : (limit as number) - 1,
				select: { id: true },
				relationLoadStrategy: 'join',
			});

			if (lastPage?.id) {
				pages.last = lastPage.id;
			}

			const pageQuotes = quotes.slice(0, limit as number);

			return ctx.json(
				serializerCursor(pageQuotes.map(serializer), {
					total,
					...(!!previousCursor && {
						previous: previousCursor,
					}),
					...(!!nextCursor && {
						next: nextCursor,
					}),
					...(!!pages && {
						pages,
					}),
				}),
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
