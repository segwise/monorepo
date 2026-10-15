import type { InsuranceCompany } from '@segwise/core/types';
import type { Prisma } from '@segwise/database/client';
import type { SerializerProps } from '@/@types/serializer';
import type { selectPrisma } from '@/db-adapters/insurance-company/details';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.InsuranceCompanyGetPayload<{
		select: typeof selectPrisma;
	}>,
	{ storage }: SerializerProps,
): InsuranceCompany {
	return {
		id: props.id,
		name: props.name,
		icon: getPresignedUrl(storage, props.icon),
		cnpj: props.cnpj,
		contacts: props.contacts.map((props) => ({
			index: props.index,
			label: props.label,
			contacts: props.contacts.map((props) => ({
				coverage: props.coverage,
				index: props.index,
				value: props.value,
				isWhatsapp: props.isWhatsapp,
			})),
		})),
	} satisfies InsuranceCompany;
}

export { serializer };
