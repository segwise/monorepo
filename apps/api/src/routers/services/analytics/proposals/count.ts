import { zValidator } from '@hono/zod-validator';
import {
	SchemaBasisOfAnalysis,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core';
import { addMonths, addYears, endOfDay, startOfDay, subYears } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import z from 'zod';
import type { Server } from '@/@types/server';
import { type Prisma, Role } from '@/generated/prisma/client';

function registerRoutersServicesAnalyticsProposalsCount(server: Server) {
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

			const [current, after] = await ctx.database.$transaction([
				ctx.database.safe.count({
					where: {
						...where,
						...(!!search && {
							expiration: {
								gte: subYears(startOfDay(toZonedTime(new Date(), 'UTC')), 1),
							},
						}),
						...(!search &&
							effectivedAt && {
								expiration: {
									gte: startOfDay(toZonedTime(effectivedAt.start, 'UTC')),
									lt: endOfDay(toZonedTime(effectivedAt.end, 'UTC')),
								},
							}),
					},
				}),
				ctx.database.safe.count({
					where: {
						...where,
						...(!!search && {
							expiration: {
								gte:
									basisOfAnalysis === 'year'
										? addYears(
												subYears(startOfDay(toZonedTime(new Date(), 'UTC')), 1),
												1,
											)
										: addMonths(
												subYears(startOfDay(toZonedTime(new Date(), 'UTC')), 1),
												1,
											),
								lte:
									basisOfAnalysis === 'year'
										? addYears(
												subYears(startOfDay(toZonedTime(new Date(), 'UTC')), 1),
												2,
											)
										: addMonths(
												subYears(startOfDay(toZonedTime(new Date(), 'UTC')), 1),
												2,
											),
							},
						}),
						...(!search &&
							effectivedAt && {
								expiration: {
									gte:
										basisOfAnalysis === 'year'
											? addYears(
													startOfDay(toZonedTime(effectivedAt.start, 'UTC')),
													1,
												)
											: addMonths(
													startOfDay(toZonedTime(effectivedAt.start, 'UTC')),
													1,
												),
									lt:
										basisOfAnalysis === 'year'
											? addYears(
													endOfDay(toZonedTime(effectivedAt.end, 'UTC')),
													1,
												)
											: addMonths(
													endOfDay(toZonedTime(effectivedAt.end, 'UTC')),
													1,
												),
								},
							}),
					},
				}),
			]);

			return ctx.json(
				{
					current,
					after,
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesAnalyticsProposalsCount };
