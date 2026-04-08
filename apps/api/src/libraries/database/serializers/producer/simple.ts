import type { ProducerSimple } from '@segwise/core/types';
import type { SerializerProps } from '@/@types/serializer';
import type { Prisma } from '@/generated/prisma/client';
import type { selectPrisma } from '@/libraries/database/adapters/producer/simple';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.UserGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): ProducerSimple {
	return {
		id: props.id,
		name: props.name,
		...(props.image && {
			avatar: getPresignedUrl(storage, props.image),
		}),
		contact: {
			email: props.email,
			...(props.phone && {
				phone: props.phone,
			}),
		},
		referral: props.members[0]?.referral as string,
	} satisfies ProducerSimple;
}

export { serializer };
