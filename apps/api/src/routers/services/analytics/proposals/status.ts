import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core';
import { endOfDay, startOfDay, subMonths, subYears } from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import { type Prisma, Role } from '@/generated/prisma/client';

function registerRoutersServicesAnalyticsProposalsStatus(server: Server) {
	const base = server.basePath('/status');

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
					brokers: true,
					effectivedAt: true,
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
				effectivedAt,
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

			const where: Prisma.SafeWhereInput = {
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
				effectivedAt: null,
			};

			const [current, before] = await ctx.database.$transaction([
				ctx.database.safe.count({
					where: {
						...where,
						status: {
							in: status,
						},
						...(!!effectivedAt && {
							requestedAt: {
								...(typeof effectivedAt === 'string' && {
									gte: startOfDay(effectivedAt),
									lte: endOfDay(effectivedAt),
								}),
								...(typeof effectivedAt === 'object' && {
									gte: startOfDay(effectivedAt.start),
									lte: endOfDay(effectivedAt.end),
								}),
							},
						}),
					},
				}),
				ctx.database.safe.count({
					where: {
						...where,
						status: {
							in: status,
						},
						...(!!effectivedAt && {
							requestedAt: {
								...(typeof effectivedAt === 'string' && {
									gte:
										basisOfAnalysis === 'year'
											? subYears(startOfDay(effectivedAt), 1)
											: subMonths(startOfDay(effectivedAt), 1),
									lte:
										basisOfAnalysis === 'year'
											? subYears(endOfDay(effectivedAt), 1)
											: subMonths(endOfDay(effectivedAt), 1),
								}),
								...(typeof effectivedAt === 'object' && {
									gte:
										basisOfAnalysis === 'year'
											? subYears(startOfDay(effectivedAt.start), 1)
											: subMonths(startOfDay(effectivedAt.start), 1),
									lte:
										basisOfAnalysis === 'year'
											? subYears(endOfDay(effectivedAt.end), 1)
											: subMonths(endOfDay(effectivedAt.end), 1),
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

export { registerRoutersServicesAnalyticsProposalsStatus };
