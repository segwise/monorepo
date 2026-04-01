import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core';
import { subMonths, subYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';

function registerRoutersServicesAnalyticsSafesCount(server: Server) {
	const base = server.basePath('/count');

	base.get(
		'/',
		zValidator(
			'query',
			z
				.object({
					...SchemaSearchParamsSafeSimple.shape,
				})
				.extend({
					basisOfAnalysis: SchemaBasisOfAnalysis.default('year'),
				})
				.pick({
					basisOfAnalysis: true,
					search: true,
					producers: true,
					insuranceCompanies: true,
					effectivedAt: true,
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
				effectivedAt,
				modality,
				status,
				renewal,
			} = ctx.req.valid('query');

			const where: Prisma.SafeWhereInput = {
				OR: [
					{
						isExternal: false,
					},
					{
						isExternal: null,
					},
				],
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
				ctx.database.safe.count({
					where: {
						...where,
						effectivedAt: {
							gte: effectivedAt.start,
							lte: effectivedAt.end,
						},
					},
				}),
				ctx.database.safe.count({
					where: {
						...where,
						effectivedAt: {
							gte:
								basisOfAnalysis === 'year'
									? subYears(effectivedAt.start, 1)
									: subMonths(effectivedAt.start, 1),
							lte:
								basisOfAnalysis === 'year'
									? subYears(effectivedAt.end, 1)
									: subMonths(effectivedAt.end, 1),
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

export { registerRoutersServicesAnalyticsSafesCount };
