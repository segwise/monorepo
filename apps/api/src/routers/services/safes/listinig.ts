import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsSafeSimple } from '@segwise/core/schemas';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/safe/simple';
import { serializer } from '@/db-serializers/safe/simple';
import { type Prisma, Role } from '@/generated/prisma/client';
import { serializerCursor } from '@/libraries/database/serializers/cursor';

function registerRoutersServicesSafesSimpleListining(server: Server) {
	server.get(
		'/simple',
		zValidator('query', SchemaSearchParamsSafeSimple),
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
				effectived,
			} = ctx.req.valid('query');

			const pageMargins = 2;

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
				...(effectived === true && {
					effectivedAt: {
						gte: effectivedAt.start,
						lte: effectivedAt.end,
					},
				}),
				...(effectived === false && {
					requestedAt: {
						gte: effectivedAt.start,
						lte: effectivedAt.end,
					},
					effectivedAt: null,
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
									mode: 'insensitive',
								},
							},
						},
						{
							temporaryInsured: {
								name: {
									search: search.replaceAll(' ', '&'),
									mode: 'insensitive',
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

			const [safes, total, itemsBefore] = await ctx.database.$transaction([
				ctx.database.safe.findMany({
					where,
					...(cursor && {
						cursor: {
							id: cursor,
						},
					}),
					take: (limit as number) + 1,
					orderBy: {
						id: 'desc',
					},
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
								orderBy: {
									id: 'asc',
								},
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
						orderBy: { id: 'desc' },
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
						orderBy: { id: 'asc' },
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
				orderBy: { id: 'asc' },
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

	server.get('/simple/plate/:plate', async (ctx) => {
		const { plate } = ctx.req.param();

		const where: Prisma.SafeWhereInput = {
			safeVehicle: {
				vehicle: {
					OR: [
						{
							plate: plate,
						},
						{
							plateAlternative: plate,
						},
					],
				},
			},
		};

		const safe = await ctx.database.safe.findFirst({
			where,
			select: selectPrisma,
			relationLoadStrategy: 'join',
		});

		if (!safe) {
			return ctx.json(
				{
					message: 'Seguro não encontrado',
				},
				404,
			);
		}

		return ctx.json(serializer(safe), 200);
	});
}

export { registerRoutersServicesSafesSimpleListining };
