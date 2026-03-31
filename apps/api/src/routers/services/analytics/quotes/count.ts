import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core';
import { subMonths, subYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesAnalyticsQuotesCount(server: Server) {
	const base = server.basePath('/count');

	base.get(
		'/',
		zValidator(
			'query',
			z
				.object({
					...SchemaSearchParamsQuoteSimple.shape,
				})
				.extend({
					basisOfAnalysis: SchemaBasisOfAnalysis.default('year'),
				})
				.pick({
					basisOfAnalysis: true,
					search: true,
					producers: true,
					insuranceCompanies: true,
					requestAt: true,
					modality: true,
					status: true,
					renewal: true,
				})
				.strict(),
		),
		async (ctx) => {
			const {
				basisOfAnalysis,
				search,
				producers,
				insuranceCompanies,
				requestAt,
				modality,
				status,
				renewal,
			} = ctx.req.valid('query');

			const where: Prisma.QuoteWhereInput = {
				...(!!renewal && {
					renewal,
				}),
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

			const [current, before] = await ctx.database.$transaction([
				ctx.database.quote.count({
					where: {
						...where,
						requestAt: {
							gte: requestAt.start,
							lte: requestAt.end,
						},
					},
				}),
				ctx.database.quote.count({
					where: {
						...where,
						requestAt: {
							gte:
								basisOfAnalysis === 'year'
									? subYears(requestAt.start, 1)
									: subMonths(requestAt.start, 1),
							lte:
								basisOfAnalysis === 'year'
									? subYears(requestAt.end, 1)
									: subMonths(requestAt.end, 1),
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
