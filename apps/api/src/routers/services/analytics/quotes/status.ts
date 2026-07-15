import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core';
import { endOfDay, startOfDay, subMonths, subYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import { type Prisma, Role } from '@/generated/prisma/client';

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
					brokers: true,
					requestedAt: true,
					modality: true,
					status: true,
					renewal: true,
				})
				.strict(),
		),
		async (ctx) => {
			const brokerId = ctx.session.brokerId;

			const {
				basisOfAnalysis,
				search,
				producers,
				insuranceCompanies,
				brokers,
				requestedAt,
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
				...(!!brokerId && {
					brokerId,
				}),
				...(ctx.session.role !== Role.customer &&
					!!brokers?.length && {
						broker: {
							id: {
								in: brokers,
							},
						},
					}),
				...(!!renewal && {
					renewal,
				}),
				...(!!search && {
					OR: [
						{
							insured: {
								name: {
									search: search.replaceAll(' ', '&'),
								},
							},
						},
						{
							temporaryInsured: {
								name: {
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
				...(!producers?.length && {
					OR: [
						{
							producerId: {
								not: '019f249d-8880-7000-b962-aace743e68e2',
							},
						},
						{
							producerId: null,
						},
					],
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
						...(!!requestedAt && {
							requestedAt: {
								...(typeof requestedAt === 'string' && {
									gte: startOfDay(requestedAt),
									lte: endOfDay(requestedAt),
								}),
								...(typeof requestedAt === 'object' && {
									gte: startOfDay(requestedAt.start),
									lte: endOfDay(requestedAt.end),
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
						...(!!requestedAt && {
							requestedAt: {
								...(typeof requestedAt === 'string' && {
									gte:
										basisOfAnalysis === 'year'
											? subYears(startOfDay(requestedAt), 1)
											: subMonths(startOfDay(requestedAt), 1),
									lte:
										basisOfAnalysis === 'year'
											? subYears(endOfDay(requestedAt), 1)
											: subMonths(endOfDay(requestedAt), 1),
								}),
								...(typeof requestedAt === 'object' && {
									gte:
										basisOfAnalysis === 'year'
											? subYears(startOfDay(requestedAt.start), 1)
											: subMonths(startOfDay(requestedAt.start), 1),
									lte:
										basisOfAnalysis === 'year'
											? subYears(endOfDay(requestedAt.end), 1)
											: subMonths(endOfDay(requestedAt.end), 1),
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
