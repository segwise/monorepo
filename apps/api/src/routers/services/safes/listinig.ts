import { zValidator } from '@hono/zod-validator';
import { isCNPJ, isCPF, isPhone, isPlate, maskNumber } from '@segwise/core';
import {
	SchemaSearchParamsSafeRegistration,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core/schemas';
import { endOfDay, endOfMonth, set, startOfDay, subYears } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import z from 'zod';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/safe/simple';
import { serializer } from '@/db-serializers/safe/simple';
import { type Prisma, Role, StatusSafe } from '@/generated/prisma/client';
import { serializerCursor } from '@/libraries/database/serializers/cursor';

function registerRoutersServicesSafesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator(
			'query',
			SchemaSearchParamsSafeSimple.extend({
				isExternal: z
					.literal(['true', 'false'])
					.or(z.boolean())
					.transform((value) =>
						value === 'true' ? true : value === 'false' ? false : value,
					)
					.nullish(),
			}),
		),
		async (ctx) => {
			const brokerId =
				ctx?.session?.brokerId ||
				(await ctx.database.broker
					.findFirst({
						orderBy: {
							createdAt: 'asc',
						},
						select: {
							id: true,
						},
					})
					.then((response) => response?.id));

			const {
				cursor,
				limit,
				search,
				producers,
				insuranceCompanies,
				brokers,
				effectivedAt,
				modality,
				status,
				renewal,
				ids,
				isExternal,
			} = ctx.req.valid('query');

			const pageMargins = 2;

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
				...(!!ids?.length && {
					id: {
						in: ids,
					},
				}),
				...(!!isExternal && {
					isExternal: true,
				}),
				...(!!search && {
					expiration: {
						gte: subYears(startOfDay(toZonedTime(new Date(), 'UTC')), 1),
					},
				}),
				...(!search &&
					!ids?.length && {
						...(!!effectivedAt && {
							expiration: {
								gte: startOfDay(toZonedTime(effectivedAt.start, 'UTC')),
								lt: endOfDay(toZonedTime(effectivedAt.end, 'UTC')),
							},
						}),
						...(!effectivedAt && {
							expiration: {
								gte: startOfDay(toZonedTime(new Date(), 'UTC')),
								lt: endOfDay(toZonedTime(endOfMonth(new Date()), 'UTC')),
							},
						}),
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

			if (isExternal === false) {
				where.AND = where.AND ?? [];

				// @ts-expect-error
				where.AND.push({
					OR: [{ isExternal: false }, { isExternal: null }],
				});
			}

			if (search) {
				where.AND = where.AND ?? [];

				if (isCNPJ(search)) {
					// @ts-expect-error
					where.AND.push({
						insured: {
							cnpj: maskNumber(search),
						},
					});
				} else if (isCPF(search)) {
					// @ts-expect-error
					where.AND.push({
						insured: {
							cpf: maskNumber(search),
						},
					});
				} else if (isPhone(search)) {
					// @ts-expect-error
					where.AND.push({
						insured: {
							phone: {
								contains: maskNumber(search),
							},
						},
					});
				} else if (isPlate(search)) {
					// @ts-expect-error
					where.AND.push({
						safeVehicle: {
							plate: search.replaceAll('-', ''),
						},
					});
				} else {
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

			const [safes, total, itemsBefore] = await ctx.database.$transaction([
				ctx.database.safe.findMany({
					where,
					...(cursor && {
						cursor: {
							id: cursor,
						},
					}),
					take: (limit as number) + 1,
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
					select: selectPrisma,
					relationLoadStrategy: 'join',
				}),
				ctx.database.safe.count({ where }),
				cursor
					? ctx.database.safe.count({
							where: {
								...where,
								id: { gt: cursor },
							},
						})
					: ctx.database.safe.count({
							where: {
								...where,
								id: { in: [] },
							},
							take: 0,
						}),
			]);

			const currentPage = cursor
				? Math.floor(itemsBefore / (limit as number)) + 1
				: 1;

			const totalPages = Math.ceil(total / (limit as number));

			const nextCursor = safes[limit as number]?.id || null;

			let previousCursor = !safes.length
				? null
				: !cursor
					? null
					: (await ctx.database.safe
							.findFirst({
								where,
								cursor: {
									id: safes[0]?.id,
								},
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
								skip: limit as number,
								select: {
									id: true,
								},
							})
							.then((response) => response?.id)) || null;

			if (cursor === previousCursor) {
				previousCursor = null;
			}

			const pages: Record<
				number | 'first' | 'last' | 'count',
				string | number | null
			> = {
				first: null,
				last: null,
				count: totalPages,
			};

			pages[currentPage] = currentPage === 1 ? null : (cursor as string);

			let tempCursorForward = nextCursor;
			for (let i = 1; i <= pageMargins; i++) {
				if (!tempCursorForward) break;

				const pageNum = currentPage + i;
				pages[pageNum] = tempCursorForward;

				if (i < pageMargins) {
					const batchForward = await ctx.database.safe.findFirst({
						where,
						cursor: { id: tempCursorForward },
						skip: limit as number,
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
						select: { id: true },
					});

					tempCursorForward = batchForward?.id || null;
				}
			}

			if (currentPage > 1 && previousCursor) {
				const pageNumPrev1 = currentPage - 1;

				pages[pageNumPrev1] = pageNumPrev1 === 1 ? null : previousCursor;

				let tempCursorBackward = previousCursor;
				const maxBack = Math.min(pageMargins, currentPage - 1);

				for (let d = 2; d <= maxBack; d++) {
					const batchBackward = await ctx.database.safe.findFirst({
						where,
						cursor: { id: tempCursorBackward },
						skip: limit as number,
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
						select: { id: true },
					});

					const furtherPrev = batchBackward?.id || null;
					if (!furtherPrev) break;

					const pageNum = currentPage - d;

					pages[pageNum] = pageNum === 1 ? null : furtherPrev;

					tempCursorBackward = furtherPrev;
				}
			}

			const skipGetLastPage = (total % (limit as number)) - 1;

			const lastPage = await ctx.database.safe.findFirst({
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
				skip: skipGetLastPage >= 0 ? skipGetLastPage : (limit as number) - 1,
				select: { id: true },
			});

			if (lastPage?.id) {
				pages.last = lastPage.id;
			}

			const pageSafes = safes.slice(0, limit as number);

			return ctx.json(
				serializerCursor(pageSafes.map(serializer), {
					total,
					...(!!previousCursor && {
						previous: previousCursor,
					}),
					...(!!nextCursor && {
						next: nextCursor,
					}),
					...(!!pages && {
						pages,
					}),
				}),
				200,
			);
		},
	);

	server.get(
		'/simple/registration',
		zValidator(
			'query',
			SchemaSearchParamsSafeRegistration.transform(
				({ registration, birth }) => ({
					registration,
					birth: set(birth, {
						hours: 12,
					}),
				}),
			),
		),
		async (ctx) => {
			const { registration, birth } = ctx.req.valid('query');

			const birthUtc = new Date(
				Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate()),
			);

			const [safes, count] = await ctx.database.$transaction([
				ctx.database.safe.findMany({
					where: {
						OR: [
							{
								isExternal: false,
							},
							{
								isExternal: null,
							},
						],
						insured: {
							OR: [
								{
									cpf: registration,
								},
								{
									cnpj: registration,
								},
							],
							birth: birthUtc,
						},

						status: StatusSafe.active,
						expiration: {
							gte: new Date(),
						},
					},
					select: selectPrisma,
					relationLoadStrategy: 'join',
				}),
				ctx.database.safe.count({
					where: {
						insured: {
							cpf: registration,
							birth: {
								lte: birth,
								gte: birth,
							},
						},
					},
				}),
			]);

			if (!safes.length) {
				return ctx.json(
					{
						message: 'Seguros não encontrados',
					},
					404,
				);
			}

			const results = safes.map(serializer);

			return ctx.json(
				serializerCursor(results, {
					total: count,
				}),
				200,
			);
		},
	);

	server.get(
		'/simple/plate/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}',
		async (ctx) => {
			const { plate } = ctx.req.param();

			const plateFormatter = plate.replace('-', '').toLowerCase();

			const where: Prisma.SafeWhereInput = {
				OR: [
					{
						isExternal: false,
					},
					{
						isExternal: null,
					},
				],
				safeVehicle: {
					OR: [
						{
							plate: plateFormatter,
						},
						{
							plate: plateFormatter.toUpperCase(),
						},
					],
				},
			};

			const safe = await ctx.database.safe.findFirst({
				where,
				select: selectPrisma,
				relationLoadStrategy: 'join',
				orderBy: {
					requestedAt: 'desc',
				},
			});

			if (!safe) {
				return ctx.json(
					{
						message: 'Seguro não encontrado',
					},
					404,
				);
			}

			return ctx.json(
				{
					type: 'safe',
					...serializer(safe),
				},
				200,
			);
		},
	);
}

export { registerRoutersServicesSafesSimpleListining };
