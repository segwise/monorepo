import { zValidator } from '@hono/zod-validator';
import {
	SchemaMarketplaceVehicleRegisterForm,
	SchemaSearchParamsMarketplaceSimple,
} from '@segwise/core';
import z from 'zod';
import type { Server } from '@/@types/server';
import type { Prisma } from '@/generated/prisma/client';
import { selectPrisma } from '@/libraries/database/adapters/marketplace/vehicle/simple';
import { serializerCursor } from '@/libraries/database/serializers/cursor';
import { serializer } from '@/libraries/database/serializers/marketplace/vehicle/details';

function registerRoutersServicesMarketplaceRegister(server: Server) {
	server.get('/:id', async (ctx) => {
		const id = ctx.req.param('id');

		const vehicle = await ctx.database.marketplaceVehicle.findUnique({
			where: {
				id,
			},
			select: selectPrisma,
			relationLoadStrategy: 'join',
		});

		if (!vehicle) {
			return ctx.json(
				{
					message: 'Veículo não encontrado',
				},
				404,
			);
		}

		return ctx.json(
			serializer(vehicle, {
				storage: ctx.storage.images,
			}),
			200,
		);
	});

	server.get(
		'/',
		zValidator('query', SchemaSearchParamsMarketplaceSimple),
		async (ctx) => {
			const { cursor, limit } = ctx.req.valid('query');

			const pageMargins = 2;

			const clientRegistration = ctx.req.header(
				'Client-Registration',
			) as unknown as string;

			const where: Prisma.MarketplaceVehicleWhereInput = {
				clientRegistration,
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

	server.delete('/:id', async (ctx) => {
		const id = ctx.req.param('id');

		await ctx.database.marketplaceVehicle.delete({
			where: {
				id,
			},
		});

		return ctx.json(
			{
				message: 'Excluído com sucesso',
			},
			200,
		);
	});

	server.post('/', async (ctx) => {
		const clientRegistration = ctx.req.header(
			'Client-Registration',
		) as unknown as string;

		const formData = await ctx.req.formData();

		const body = {
			photos: formData.getAll('photos'),
			model: formData.get('model'),
			year: formData.get('year'),
			plate: formData.get('plate'),
			color: formData.get('color'),
			fuel: formData.get('fuel'),
			transmission: formData.get('transmission'),
			state: formData.get('state'),
			city: formData.get('city'),
			price: formData.get('price'),
			mileage: formData.get('mileage'),
			description: formData.get('description') ?? undefined,
		};

		const parsed = SchemaMarketplaceVehicleRegisterForm.safeParse(body);

		if (!parsed.success) {
			return ctx.json(
				{
					message: 'Dados inválidos',
					errors: z.treeifyError(parsed.error),
				},
				422,
			);
		}

		const {
			photos,
			model,
			year,
			plate,
			color,
			fuel,
			transmission,
			state,
			city,
			price,
			mileage,
			description,
		} = parsed.data;

		const existingPlate = await ctx.database.marketplaceVehicle.findUnique({
			where: { plate },
			select: { id: true },
		});

		if (existingPlate) {
			return ctx.json(
				{ message: 'Já existe um anúncio cadastrado com esta placa' },
				409,
			);
		}

		const photoBuffers: Array<{ buffer: ArrayBuffer; type: string } | string> =
			await Promise.all(
				photos.map(async (photo) => {
					if (typeof photo === 'string') return photo;

					const buffer = await (photo as File).arrayBuffer();
					const type = (photo as File).type || 'image/jpeg';

					return { buffer, type };
				}),
			);

		const uploadedPhotos: Array<string> = [];

		for (let i = 0; i < photoBuffers.length; i++) {
			const photo = photoBuffers[i];

			if (typeof photo === 'string') {
				uploadedPhotos.push(photo);
				continue;
			}

			// @ts-expect-error
			const ext = photo.type.split('/')[1] ?? 'jpeg';
			const path = `/marketplace/vehicles/${plate}-${i}.${ext}`;

			// @ts-expect-error
			const mimeType = photo.type.startsWith('image/')
				? // @ts-expect-error
					photo.type
				: `image/${ext}`;

			// @ts-expect-error
			await ctx.storage.images.write(path, photo?.buffer, {
				type: mimeType,
				acl: 'public-read',
			});

			uploadedPhotos.push(path);
		}

		const fuelValue = typeof fuel === 'string' ? fuel : fuel.value;

		const transmissionValue =
			typeof transmission === 'string' ? transmission : transmission.value;

		const stateValue = typeof state === 'string' ? state : state.value;

		const cityValue = typeof city === 'string' ? city : city.value;

		await ctx.database.marketplaceVehicle.create({
			data: {
				clientRegistration,
				model,
				year,
				plate,
				color,
				// @ts-expect-error
				fuel: fuelValue,
				// @ts-expect-error
				transmission: transmissionValue,
				state: stateValue,
				city: cityValue,
				price,
				mileage,
				description: description || null,
				status: 'active',
				photos: uploadedPhotos,
			},
		});

		return ctx.json(
			{
				message: 'Anúncio registrado com sucesso',
			},
			200,
		);
	});

	server.patch('/:id', async (ctx) => {
		const id = ctx.req.param('id');

		const formData = await ctx.req.formData();

		const body = {
			photos: formData.getAll('photos'),
			model: formData.get('model'),
			year: formData.get('year'),
			plate: formData.get('plate'),
			color: formData.get('color'),
			fuel: formData.get('fuel'),
			transmission: formData.get('transmission'),
			state: formData.get('state'),
			city: formData.get('city'),
			price: formData.get('price'),
			mileage: formData.get('mileage'),
			description: formData.get('description') ?? undefined,
		};

		const parsed = SchemaMarketplaceVehicleRegisterForm.partial({
			photos: true,
		}).safeParse(body);

		if (!parsed.success) {
			return ctx.json(
				{
					message: 'Dados inválidos',
					errors: z.treeifyError(parsed.error).errors,
				},
				422,
			);
		}

		const {
			photos,
			model,
			year,
			plate,
			color,
			fuel,
			transmission,
			state,
			city,
			price,
			mileage,
			description,
		} = parsed.data;

		const photoBuffers: Array<{ buffer: ArrayBuffer; type: string } | string> =
			await Promise.all(
				(photos || []).map(async (photo) => {
					if (typeof photo === 'string') return photo;

					const buffer = await (photo as File).arrayBuffer();
					const type = (photo as File).type || 'image/jpeg';

					return { buffer, type };
				}),
			);

		const uploadedPhotos: Array<string> = [];

		for (let i = 0; i < photoBuffers.length; i++) {
			const photo = photoBuffers[i];

			if (typeof photo === 'string') {
				uploadedPhotos.push(photo);
				continue;
			}

			// @ts-expect-error
			const ext = photo.type.split('/')[1] ?? 'jpeg';
			const path = `/marketplace/vehicles/${plate}-${i}.${ext}`;

			// @ts-expect-error
			const mimeType = photo.type.startsWith('image/')
				? // @ts-expect-error
					photo.type
				: `image/${ext}`;

			// @ts-expect-error
			await ctx.storage.images.write(path, photo?.buffer, {
				type: mimeType,
				acl: 'public-read',
			});

			uploadedPhotos.push(path);
		}

		const fuelValue = typeof fuel === 'string' ? fuel : fuel.value;

		const transmissionValue =
			typeof transmission === 'string' ? transmission : transmission.value;

		const stateValue = typeof state === 'string' ? state : state.value;

		const cityValue = typeof city === 'string' ? city : city.value;

		await ctx.database.marketplaceVehicle.update({
			where: {
				id,
			},
			data: {
				model,
				year,
				plate,
				color,
				// @ts-expect-error
				fuel: fuelValue,
				// @ts-expect-error
				transmission: transmissionValue,
				state: stateValue,
				city: cityValue,
				price,
				mileage,
				description: description || null,
				status: 'active',
				photos: uploadedPhotos,
			},
		});

		return ctx.json(
			{
				message: 'Anúncio registrado com sucesso',
			},
			200,
		);
	});
}

export { registerRoutersServicesMarketplaceRegister };
