import type { MarketplaceVehicleRegisterForm } from '@segwise/core/types';
import type { SerializerProps } from '@/@types/serializer';
import type { Prisma } from '@/generated/prisma/client';
import type { selectPrisma } from '@/libraries/database/adapters/marketplace/vehicle/simple';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.MarketplaceVehicleGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): MarketplaceVehicleRegisterForm {
	return {
		// @ts-expect-error
		id: props.id,
		photos: props.photos.length
			? props.photos.map((photo) =>
					photo.includes('/seed')
						? photo
						: getPresignedUrl(storage, photo as string),
				)
			: [],
		model: props.model,
		year: props.year,
		price: props.price.toDecimalPlaces(2).toNumber(),
		mileage: props.mileage,
		color: props.color,
		city: props.city,
		state: props.state,
		fuel: props.fuel,
		transmission: props.transmission,
		plate: props.plate,
		description: props.description,
	} satisfies MarketplaceVehicleRegisterForm;
}

export { serializer };
