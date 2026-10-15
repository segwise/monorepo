import type { BrokerPublic } from '@segwise/core/types';
import type { Prisma } from '@segwise/database/client';
import type { SerializerProps } from '@/@types/serializer';
import type { selectPrisma } from '@/db-adapters/broker/public';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.BrokerGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): BrokerPublic {
	return {
		name: props.name,
		...(props.fantasy && {
			fantasy: props.fantasy,
		}),
		...(props.logo && {
			logo: getPresignedUrl(storage, props.logo),
		}),
	} satisfies BrokerPublic;
}

export { serializer };
