import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsQuoteSimple } from '@segwise/core';
import {
	endOfDay,
	endOfMonth,
	startOfDay,
	startOfMonth,
	subMonths,
	subYears,
} from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesAnalyticsQuotesCount(server: Server) {
	const base = server.basePath('/count');

	base.get(
		'/',
		zValidator(
			'query',
			z.object({
				type: z.enum(['year', 'month']),
				...SchemaSearchParamsQuoteSimple.shape,
			}),
		),
		async (ctx) => {
			const { type, search, requestAt } = ctx.req.valid('query');

			const where: Prisma.QuoteWhereInput = {
				...(!!search && {
					OR: [
						{
							insured: {
								name: {
									mode: 'insensitive',
									search: search.replaceAll(' ', '&'),
								},
							},
						},
						{
							temporaryInsured: {
								name: {
									mode: 'insensitive',
									search: search.replaceAll(' ', '&'),
								},
							},
						},
					],
				}),
			};

			const [current, before] = await ctx.database.$transaction([
				ctx.database.quote.count({
					where: {
						...where,
						requestAt: {
							...(!requestAt && {
								gte: startOfMonth(startOfDay(new Date())),
								lte: endOfMonth(endOfDay(new Date())),
							}),
							...(!!requestAt && {
								...(typeof requestAt === 'string' && {
									gte: startOfDay(requestAt),
									lte: endOfDay(requestAt),
								}),
								...(typeof requestAt === 'object' && {
									gte: startOfDay(requestAt.start),
									lte: endOfDay(requestAt.end),
								}),
							}),
						},
					},
				}),
				ctx.database.quote.count({
					where: {
						...where,
						requestAt: {
							...(!requestAt && {
								gte:
									type === 'year'
										? subYears(startOfMonth(startOfDay(new Date())), 1)
										: subMonths(startOfMonth(startOfDay(new Date())), 1),
								lte:
									type === 'year'
										? subYears(endOfMonth(endOfDay(new Date())), 1)
										: subMonths(endOfMonth(endOfDay(new Date())), 1),
							}),
							...(!!requestAt && {
								...(typeof requestAt === 'string' && {
									gte:
										type === 'year'
											? subYears(startOfDay(requestAt), 1)
											: subMonths(startOfDay(requestAt), 1),
									lte:
										type === 'year'
											? subYears(endOfDay(requestAt), 1)
											: subMonths(endOfDay(requestAt), 1),
								}),
								...(typeof requestAt === 'object' && {
									gte:
										type === 'year'
											? subYears(startOfDay(requestAt.start), 1)
											: subMonths(startOfDay(requestAt.start), 1),
									lte:
										type === 'year'
											? subYears(endOfDay(requestAt.end), 1)
											: subMonths(endOfDay(requestAt.end), 1),
								}),
							}),
						},
					},
				}),
			]);

			return ctx.json(
				{
					current,
					before,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsQuotesCount };
