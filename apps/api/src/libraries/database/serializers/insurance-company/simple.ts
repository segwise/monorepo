import type { InsuranceCompanySimple } from '@segwise/core/types';
import type { selectPrisma } from '@/db-adapters/insurance-company/simple';
import type { Prisma } from '@/generated/prisma/client';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

interface SerializerProps {
	storage: Bun.S3Client;
}

function serializer(
	props: Prisma.InsuranceCompanyGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): InsuranceCompanySimple {
	return {
		id: props.id,
		name: props.name,
		icon: getPresignedUrl(storage, props.icon),
		cnpj: props.cnpj,
	} satisfies InsuranceCompanySimple;
}

export { serializer };
