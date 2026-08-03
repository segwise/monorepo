import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core';
import { endOfDay, startOfDay, subMonths, subYears } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
				...(ctx?.session?.role !== Role.customer &&
					!!brokers?.length && {
						broker: {
							id: {
								in: brokers,
							},
						},
					}),
				expiration: {
					gte: startOfDay(toZonedTime(effectivedAt.start, 'UTC')),
					lt: endOfDay(toZonedTime(effectivedAt.end, 'UTC')),
				},
				...(!!renewal && {
					renewal,
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

			where.AND = where.AND ?? [];

			// @ts-expect-error
			where.AND.push({
				OR: [{ isExternal: false }, { isExternal: null }],
			});

			if (search) {
				where.AND = where.AND ?? [];

				// @ts-expect-error
				where.AND.push({
					OR: [
						{
							insured: {
								name: { search: search.replaceAll(' ', '&') },
							},
						},
						{
							temporaryInsured: {
								name: { search: search.replaceAll(' ', '&') },
							},
						},
					],
				});
			}

			if (!producers?.length) {
				where.AND = where.AND ?? [];

				// @ts-expect-error
				where.AND.push({
					OR: [
						{ producerId: { not: '019f249d-8880-7000-b962-aace743e68e2' } },
						{ producerId: null },
					],
				});
			}

			const [current, before] = await ctx.database.$transaction([
				ctx.database.safe.count({
					where,
					orderBy: [
						{
							expiration: 'asc',
						},
						{
							insured: {
								name: 'asc',
							},
						},
					],
				}),
				ctx.database.safe.count({
					where: {
						...where,
						expiration: {
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

export { registerRoutersServicesAnalyticsProposalsStatus };
