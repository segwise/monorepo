import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core';
import { endOfDay, startOfDay, subMonths, subYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesAnalyticsQuotesStatus(server: Server) {
	const base = server.basePath('/status');

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

			if (!status?.length) {
				return ctx.json(
					{
						message: 'Informe o status para consulta',
					},
					409,
				);
			}

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
						status: {
							in: status,
						},
						...(!!requestAt && {
							requestAt: {
								...(typeof requestAt === 'string' && {
									gte: startOfDay(requestAt),
									lte: endOfDay(requestAt),
								}),
								...(typeof requestAt === 'object' && {
									gte: startOfDay(requestAt.start),
									lte: endOfDay(requestAt.end),
								}),
							},
						}),
					},
				}),
				ctx.database.quote.count({
					where: {
						...where,
						status: {
							in: status,
						},
						...(!!requestAt && {
							requestAt: {
								...(typeof requestAt === 'string' && {
									gte:
										basisOfAnalysis === 'year'
											? subYears(startOfDay(requestAt), 1)
											: subMonths(startOfDay(requestAt), 1),
									lte:
										basisOfAnalysis === 'year'
											? subYears(endOfDay(requestAt), 1)
											: subMonths(endOfDay(requestAt), 1),
								}),
								...(typeof requestAt === 'object' && {
									gte:
										basisOfAnalysis === 'year'
											? subYears(startOfDay(requestAt.start), 1)
											: subMonths(startOfDay(requestAt.start), 1),
									lte:
										basisOfAnalysis === 'year'
											? subYears(endOfDay(requestAt.end), 1)
											: subMonths(endOfDay(requestAt.end), 1),
								}),
							},
						}),
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
