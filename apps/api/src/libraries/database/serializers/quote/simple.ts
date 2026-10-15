import type { QuoteSimple } from '@segwise/core/types';
import type { Prisma } from '@segwise/database/client';
import type { selectPrisma } from '@/db-adapters/quote/simple';

function serializer(
	props: Prisma.QuoteGetPayload<{
		select: typeof selectPrisma;
	}>,
): QuoteSimple {
	if (!props.temporaryInsured) {
		throw new Error(`Segurado não registrado na cotação: ${props.id}`);
	}

	return {
		id: props.id,
		producer: props.producerId,
		modality: props.modality,
		status: props.status,
		...(props.renewal && {
			renewal: props.renewal,
		}),
		...(props.association && {
			association: props.association,
		}),
		insured: {
			name: props.temporaryInsured.name,
			contact: {
				phone: props.temporaryInsured.phone,
			},
		},
		...(props.insuranceCompanyId && {
			insuranceCompany: props.insuranceCompanyId,
		}),
		broker: props.brokerId,
		...(!!props.quoteVehicle && {
			vehicle: {
				plate: props.quoteVehicle.plate || props.quoteVehicle.vehicle?.plate,
				manufacturer:
					props.quoteVehicle.vehicle?.manufacturerId ||
					props.quoteVehicle.vehicleWithoutPlate?.manufacturerId ||
					'',
				model:
					props.quoteVehicle.vehicle?.model ||
					props.quoteVehicle.vehicleWithoutPlate?.model ||
					'',
				modelYear:
					props.quoteVehicle.vehicle?.modelYear ||
					props.quoteVehicle.vehicleWithoutPlate?.modelYear ||
					0,
			},
		}),
		expiration: props.expiration,
		requestedAt: props.requestedAt,
	} satisfies QuoteSimple;
}

export { serializer };
