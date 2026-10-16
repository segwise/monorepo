import { zValidator } from '@hono/zod-validator';
import { maskNumber, SchemaMarketplaceRegister } from '@segwise/core';
import type { Server } from '@/@types/server';
import { optimizePhoto } from '@/libraries/images/optimize-photo';

function registerRoutersServicesMarketplaceRegister(server: Server) {
	server.post(
		'/',
		zValidator('form', SchemaMarketplaceRegister),
		async (ctx) => {
			const {
				images,
				insured,
				plate,
				postalCode,
				manufacturer,
				phone,
				type,
				model,
				modelYear,
				exchange,
				fuel,
				direction,
				km,
				optionals,
				conservations,
				color,
				financialState,
				description,
				price,
				acceptExchange,
				acceptExchangeAmount,
				acceptExchangeChange1,
				acceptExchangeChange2,
				acceptExchangeChange3,
			} = ctx.req.valid('form');

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

			const imagesBuffers: Array<
				{ buffer: ArrayBuffer; type: string } | string
			> = await Promise.all(
				images.map(async (photo) => {
					if (typeof photo === 'string') return photo;

					const buffer = await (photo as File).arrayBuffer();
					const type = (photo as File).type || 'image/jpeg';

					return { buffer, type };
				}),
			);

			const uploadedPhotos: Array<string> = [];

			for (const [i, photo] of imagesBuffers.entries()) {
				if (typeof photo === 'string') {
					uploadedPhotos.push(photo);
					continue;
				}

				const optimized = await optimizePhoto(photo.buffer, photo.type);
				const path = `/marketplace/vehicles/${plate}-${i}.${optimized.ext}`;

				await ctx.storage.images.write(path, optimized.bytes, {
					type: optimized.type,
					acl: 'public-read',
				});

				uploadedPhotos.push(path);
			}

			const address = await fetch(
				`https://opencep.com/v1/${maskNumber(postalCode)}.json`,
				{
					method: 'GET',
				},
			);

			if (!address.ok) {
				return ctx.json(
					{
						message: 'Endereço não encontrado',
					},
					409,
				);
			}

			const addressResponse = await address.json();

			await ctx.database.marketplaceVehicle.create({
				data: {
					insured: {
						connect: {
							id: insured,
						},
					},
					photos: uploadedPhotos,
					type,
					manufacturer,
					model,
					year: modelYear,
					modelYear,
					plate,
					color,
					fuel,
					transmission: exchange,
					direction,
					financialState,
					price,
					mileage: km,
					optionals: optionals ?? [],
					conservations: conservations ?? [],
					description,
					phone,
					postalCode,
					// @ts-expect-error
					state: String(addressResponse.estado).toLowerCase(),
					// @ts-expect-error
					city: String(addressResponse.localidade).toLowerCase(),
					acceptExchange: acceptExchange ?? null,
					acceptExchangeAmount: acceptExchangeAmount ?? null,
					acceptExchangeChange1: acceptExchangeChange1 ?? null,
					acceptExchangeChange2: acceptExchangeChange2 ?? null,
					acceptExchangeChange3: acceptExchangeChange3 ?? null,
				},
			});

			return ctx.json(
				{
					message: 'Anúncio registrado com sucesso',
				},
				200,
			);
		},
	);

	server.patch(
		'/:id',
		zValidator('form', SchemaMarketplaceRegister),
		async (ctx) => {
			const id = ctx.req.param('id');

			const {
				images,
				insured,
				plate,
				postalCode,
				manufacturer,
				phone,
				type,
				model,
				modelYear,
				exchange,
				fuel,
				direction,
				km,
				optionals,
				conservations,
				color,
				financialState,
				description,
				price,
				acceptExchange,
				acceptExchangeAmount,
				acceptExchangeChange1,
				acceptExchangeChange2,
				acceptExchangeChange3,
			} = ctx.req.valid('form');

			const existingPlate = await ctx.database.marketplaceVehicle.findFirst({
				where: { plate, NOT: { id } },
				select: { id: true },
			});

			if (existingPlate) {
				return ctx.json(
					{ message: 'Já existe um anúncio cadastrado com esta placa' },
					409,
				);
			}

			const currentVehicle = await ctx.database.marketplaceVehicle.findUnique({
				where: { id },
				select: { photos: true },
			});

			if (!currentVehicle) {
				return ctx.json({ message: 'Anúncio não encontrado' }, 404);
			}

			const extractStoragePath = (urlOrPath: string): string => {
				try {
					const url = new URL(urlOrPath);
					return url.pathname.replace(/^\/images/, '');
				} catch {
					return urlOrPath;
				}
			};

			const finalPhotos: string[] = [];
			let newFileCounter = 0;

			for (const image of images) {
				if (typeof image === 'string') {
					finalPhotos.push(extractStoragePath(image));
				} else {
					const file = image as File;
					const optimized = await optimizePhoto(
						await file.arrayBuffer(),
						file.type || 'image/jpeg',
					);
					const path = `/marketplace/vehicles/${plate}-${Date.now()}-${newFileCounter}.${optimized.ext}`;

					await ctx.storage.images.write(path, optimized.bytes, {
						type: optimized.type,
						acl: 'public-read',
					});

					finalPhotos.push(path);
					newFileCounter++;
				}
			}

			const currentPhotos = currentVehicle.photos as string[];
			const photosToDelete = currentPhotos.filter(
				(photo) => !finalPhotos.includes(photo),
			);

			await Promise.all(
				photosToDelete.map((path) => ctx.storage.images.delete(path)),
			);

			const addressRes = await fetch(
				`https://opencep.com/v1/${maskNumber(postalCode)}.json`,
			);

			if (!addressRes.ok) {
				return ctx.json({ message: 'Endereço não encontrado' }, 409);
			}

			const addressData = await addressRes.json();

			await ctx.database.marketplaceVehicle.update({
				where: { id },
				data: {
					insured: { connect: { id: insured } },
					photos: finalPhotos,
					type,
					manufacturer,
					model,
					year: modelYear,
					modelYear,
					plate,
					color,
					fuel,
					transmission: exchange,
					direction,
					financialState,
					price,
					mileage: km,
					optionals: optionals ?? [],
					conservations: conservations ?? [],
					description,
					phone,
					postalCode,
					// @ts-expect-error
					state: String(addressData.estado).toLowerCase(),
					// @ts-expect-error
					city: String(addressData.localidade).toLowerCase(),
					acceptExchange: acceptExchange ?? null,
					acceptExchangeAmount: acceptExchangeAmount ?? null,
					acceptExchangeChange1: acceptExchangeChange1 ?? null,
					acceptExchangeChange2: acceptExchangeChange2 ?? null,
					acceptExchangeChange3: acceptExchangeChange3 ?? null,
				},
			});

			return ctx.json({ message: 'Anúncio atualizado com sucesso' }, 200);
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
}

export { registerRoutersServicesMarketplaceRegister };
