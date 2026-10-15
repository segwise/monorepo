import { SchemaPaymentType } from '@segwise/core';
import type { PaymentSimple } from '@segwise/core/types';
import type { Prisma } from '@segwise/database/client';
import type { SerializerProps } from '@/@types/serializer';
import type { selectPrisma } from '@/db-adapters/payment/simple';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function serializer(
	props: Prisma.PaymentGetPayload<{
		select: typeof selectPrisma;
	}>,
	{
		storage,
		brokerId,
	}: SerializerProps & {
		brokerId?: string | null;
	},
): PaymentSimple {
	const imagePayer =
		props.payer?.broker?.image ||
		props.payer?.user?.image ||
		props.payer?.insuranceCompany?.icon;

	const imageReceiver =
		props.receiver?.broker?.image ||
		props.receiver?.user?.image ||
		props.receiver?.insuranceCompany?.icon;

	return {
		id: props.id,
		type:
			!props.receiver && !brokerId
				? SchemaPaymentType.enum.revenue
				: props.receiver?.id === brokerId
					? SchemaPaymentType.enum.revenue
					: SchemaPaymentType.enum.expense,
		method: props.method,
		status: props.status,
		payer: {
			id: props.payer?.id as string,
			name:
				(props.payer?.broker?.name as string) ||
				(props.payer?.user?.name as string) ||
				(props.payer?.insuranceCompany?.name as string),
			...(imagePayer && {
				image: getPresignedUrl(storage, imagePayer),
			}),
			additional:
				props.payer?.broker?.cnpj ||
				props.payer?.user?.phone ||
				props.payer?.insuranceCompany?.cnpj,
		},
		receiver: {
			id: props.receiver?.id as string,
			name:
				(props.receiver?.broker?.name as string) ||
				(props.receiver?.user?.name as string) ||
				(props.receiver?.insuranceCompany?.name as string),
			...(imageReceiver && {
				image: getPresignedUrl(storage, imageReceiver),
			}),
			additional:
				props.receiver?.broker?.cnpj ||
				props.receiver?.user?.phone ||
				props.receiver?.insuranceCompany?.cnpj,
		},
		amount: props.amount.toNumber(),
		amountPaid: props.amountPaid?.toNumber(),
		description: props.description,
		paidAt: props.paidAt,
		expiration: props.expiration,
	} satisfies PaymentSimple;
}

export { serializer };
