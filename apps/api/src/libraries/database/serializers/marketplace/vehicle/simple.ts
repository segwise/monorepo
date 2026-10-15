import type { MarketplaceVehicle } from '@segwise/core/types';
import type { Prisma } from '@segwise/database/client';
import type { SerializerProps } from '@/@types/serializer';
import type { selectPrisma } from '@/libraries/database/adapters/marketplace/vehicle/simple';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.MarketplaceVehicleGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): MarketplaceVehicle {
	return {
		id: props.id,
		photo:
			props.photos.length >= 1
				? props.photos[0]?.includes('/seed')
					? props.photos[0]
					: getPresignedUrl(storage, props.photos[0] as string)
				: '',
		...(props.photos.slice(1) && {
			gallery: props.photos
				.slice(1)
				.map((photo) =>
					photo?.includes('/seed')
						? photo
						: getPresignedUrl(storage, photo as string),
				),
		}),
		model: props.model,
		year: props.year,
		price: props.price.toDecimalPlaces(2).toNumber(),
		mileage: props.mileage,
		color: props.color,
		city: props.city,
		state: props.state,
		status: props.status,
		plate: props.plate,
		createdAt: props.createdAt,
		acceptExchange: props.acceptExchange,
		acceptExchangeAmount: props.acceptExchangeAmount,
		acceptExchangeChange1: props.acceptExchangeChange1,
		acceptExchangeChange2: props.acceptExchangeChange2,
		acceptExchangeChange3: props.acceptExchangeChange3,
	} satisfies MarketplaceVehicle;
}

export { serializer };
