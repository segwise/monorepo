import type { InsuranceCompanySimple } from '@segwise/core/types';
import type { Prisma } from '@segwise/database/client';
import type { SerializerProps } from '@/@types/serializer';
import type { selectPrisma } from '@/db-adapters/insurance-company/simple';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.InsuranceCompanyGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): InsuranceCompanySimple {
	return {
		id: props.id,
		name: props.name,
		cnpj: props.cnpj,
		...(props.icon && {
			icon: getPresignedUrl(storage, props.icon),
		}),
		...(props.image && {
			image: getPresignedUrl(storage, props.image),
		}),
	} satisfies InsuranceCompanySimple;
}

export { serializer };
