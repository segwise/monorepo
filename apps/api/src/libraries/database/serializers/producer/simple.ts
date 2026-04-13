import type { ProducerSimple } from '@segwise/core/types';
import type { SerializerProps } from '@/@types/serializer';
import type {
	Prisma,
	TypeOfProduction,
	TypeOfProductionPayment,
} from '@/generated/prisma/client';
import type { selectPrisma } from '@/libraries/database/adapters/producer/simple';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.UserGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): ProducerSimple {
	const member = props.members[0];

	return {
		id: props.id,
		name: props.name,
		...(props.image && {
			avatar: getPresignedUrl(storage, props.image),
		}),
		...(props.cpf && {
			cpf: props.cpf,
		}),
		contact: {
			email: props.email,
			...(props.phone && {
				phone: props.phone,
			}),
		},
		referral: member?.referral as string,
		typeOfProduction: member?.typeOfProduction as TypeOfProduction,
		typeOfProductionPayment:
			member?.typeOfProductionPayment as TypeOfProductionPayment,
		percentageOfProduction: member?.percentageOfProduction,
		startOfProductionPayment: member?.startOfProductionPayment,
	} satisfies ProducerSimple;
}

export { serializer };
