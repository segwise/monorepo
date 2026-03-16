import type { QuoteSimple } from '@segwise/core';
import type { selectPrisma } from '@/db-adapters/quote/simple';
import type { Prisma } from '@/generated/prisma/client';

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
		type: props.type,
		status: props.status,
		renewal: props.renewal,
		insured: {
			name: props.temporaryInsured.name,
			contact: {
				phone: props.temporaryInsured.phone,
			},
		},
		...(!!props.quoteVehicle && {
			vehicle: {
				plate: props.quoteVehicle.vehicle?.plate,
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
		requestAt: props.requestAt,
	} satisfies QuoteSimple;
}

export { serializer };
