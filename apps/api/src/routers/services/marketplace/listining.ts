import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsMarketplaceSimple } from '@segwise/core';
import type { Server } from '@/@types/server.d';
import type { Prisma } from '@/generated/prisma/client';
import { selectPrisma } from '@/libraries/database/adapters/marketplace/vehicle/simple';
import { serializerCursor } from '@/libraries/database/serializers/cursor';
import { serializer } from '@/libraries/database/serializers/marketplace/vehicle/simple';

function registerRoutersServicesMarketplaceListining(server: Server) {
	server.get(
		'/',
		zValidator('query', SchemaSearchParamsMarketplaceSimple),
		async (ctx) => {
			const { cursor, limit, search, priceMin, priceMax, state, city } =
				ctx.req.valid('query');

			const pageMargins = 2;

			const where: Prisma.MarketplaceVehicleWhereInput = {
				...(!!search && {
					model: {
						search: search.replaceAll(' ', '&'),
					},
				}),
				...(priceMin &&
					priceMax && {
						price: {
							lte: priceMax,
							gte: priceMin,
						},
					}),
				...(state && {
					state,
				}),
				...(state &&
					city && {
						city,
					}),
			};

			const [vehicles, total, itemsBefore] = await ctx.database.$transaction([
				ctx.database.marketplaceVehicle.findMany({
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
				ctx.database.marketplaceVehicle.count({ where }),
				cursor
					? ctx.database.marketplaceVehicle.count({
							where: {
								...where,
								id: { gt: cursor },
							},
						})
					: ctx.database.marketplaceVehicle.count({
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

			const nextCursor = vehicles[limit as number]?.id || null;

			let previousCursor = !vehicles.length
				? null
				: !cursor
					? null
					: (await ctx.database.marketplaceVehicle
							.findFirst({
								where,
								cursor: {
									id: vehicles[0]?.id,
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
					const batchForward = await ctx.database.marketplaceVehicle.findFirst({
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
					const batchBackward = await ctx.database.marketplaceVehicle.findFirst(
						{
							where,
							cursor: { id: tempCursorBackward },
							skip: limit as number,
							orderBy: { id: 'asc' },
							select: { id: true },
						},
					);

					const furtherPrev = batchBackward?.id || null;
					if (!furtherPrev) break;

					const pageNum = currentPage - d;

					pages[pageNum] = pageNum === 1 ? null : furtherPrev;

					tempCursorBackward = furtherPrev;
				}
			}

			const skipGetLastPage = (total % (limit as number)) - 1;

			const lastPage = await ctx.database.marketplaceVehicle.findFirst({
				where,
				orderBy: { id: 'asc' },
				skip: skipGetLastPage >= 0 ? skipGetLastPage : (limit as number) - 1,
				select: { id: true },
			});

			if (lastPage?.id) {
				pages.last = lastPage.id;
			}

			const pageVehicles = vehicles.slice(0, limit as number);

			return ctx.json(
				serializerCursor(
					pageVehicles.map((props) =>
						serializer(props, {
							storage: ctx.storage.images,
						}),
					),
					{
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
					},
				),
				200,
			);
		},
	);
}

export { registerRoutersServicesMarketplaceListining };
