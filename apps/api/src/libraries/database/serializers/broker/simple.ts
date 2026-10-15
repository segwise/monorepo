import type { BrokerSimple } from '@segwise/core/types';
import type { Prisma } from '@segwise/database/client';
import type { SerializerProps } from '@/@types/serializer';
import type { selectPrisma } from '@/db-adapters/broker/simple';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.BrokerGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): BrokerSimple {
	return {
		id: props.id,
		name: props.name,
		...(props.fantasy && {
			fantasy: props.fantasy,
		}),
		cnpj: props.cnpj,
		...(props.logo && {
			icon: getPresignedUrl(storage, props.logo),
		}),
		...(props.image && {
			image: getPresignedUrl(storage, props.image),
		}),
	} satisfies BrokerSimple;
}

export { serializer };
