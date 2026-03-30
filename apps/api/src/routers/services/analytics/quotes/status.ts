import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsQuoteSimple } from '@segwise/core';
import {
	endOfDay,
	endOfMonth,
	endOfToday,
	startOfDay,
	startOfMonth,
	startOfToday,
	subMonths,
	subYears,
} from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesAnalyticsQuotesStatus(server: Server) {
	const base = server.basePath('/status');

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
			const { type, search, status, requestAt } = ctx.req.valid('query');

			if (!status?.length) {
				return ctx.json(
					{
						message: 'Informe o status para consulta',
					},
					409,
				);
			}

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
						status: {
							in: status,
						},
						requestAt: {
							...(!requestAt && {
								gte: startOfMonth(startOfToday()),
								lte: endOfMonth(endOfToday()),
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
						status: {
							in: status,
						},
						requestAt: {
							...(!requestAt && {
								gte:
									type === 'year'
										? subYears(startOfMonth(startOfToday()), 1)
										: subMonths(startOfMonth(startOfToday()), 1),
								lte:
									type === 'year'
										? subYears(endOfMonth(endOfToday()), 1)
										: subMonths(endOfMonth(endOfToday()), 1),
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

export { registerRoutersServicesAnalyticsQuotesStatus };
