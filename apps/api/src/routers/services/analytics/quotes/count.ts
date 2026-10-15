import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core';
import { type Prisma, Role } from '@segwise/database/client';
import { subMonths, subYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import { timestampRange } from '@/functions/date/timestamp-range';
import { EXCLUDED_PRODUCER_ID } from '@/libraries/dashboard/metrics';

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
									contains: search.trim(),
									mode: 'insensitive',
								},
							},
						},
						{
							temporaryInsured: {
								name: {
									contains: search.trim(),
									mode: 'insensitive',
								},
							},
						},
					],
				}),
				...(!!producers?.length && {
					producerId: {
						in: producers.filter((id) => id !== EXCLUDED_PRODUCER_ID),
					},
				}),
				// AND: não pode ser `OR` direto, que colidiria com o `OR` da busca.
				AND: [
					{
						OR: [
							{ producerId: { not: EXCLUDED_PRODUCER_ID } },
							{ producerId: null },
						],
					},
				],
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
						requestedAt: timestampRange(requestedAt, ctx.timezone),
					},
				}),
				ctx.database.quote.count({
					where: {
						...where,
						requestedAt: timestampRange(
							{
								start:
									basisOfAnalysis === 'year'
										? subYears(requestedAt.start, 1)
										: subMonths(requestedAt.start, 1),
								end:
									basisOfAnalysis === 'year'
										? subYears(requestedAt.end, 1)
										: subMonths(requestedAt.end, 1),
							},
							ctx.timezone,
						),
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
