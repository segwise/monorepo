import type { VehicleManufacturer } from '@segwise/core/types';
import type { selectPrisma } from '@/db-adapters/vehicle/manufacturer';
import type { Prisma } from '@/generated/prisma/client';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

interface SerializerProps {
	storage: Bun.S3Client;
}

function serializer(
	props: Prisma.ManufacturerVehicleGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): VehicleManufacturer {
	return {
		id: props.id,
		name: props.name,
		...(props.icon && {
			icon: getPresignedUrl(storage, props.icon),
		}),
	} satisfies VehicleManufacturer;
}

export { serializer };
