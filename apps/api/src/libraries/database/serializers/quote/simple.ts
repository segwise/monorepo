import type { QuoteSimple } from '@segwise/core';
import type { selectPrisma } from '@/db-adapters/quote/simple';
import type { Prisma } from '@/generated/prisma/client';

function serializer(
	props: Prisma.QuoteGetPayload<{
		select: typeof selectPrisma;
	}>,
): QuoteSimple {
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
		...(props.temporaryVehicle && {
			vehicle: {
				plate: props.temporaryVehicle?.plate,
				manufacturer: props.temporaryVehicle.manufacturer,
				model: props.temporaryVehicle.model,
				modelYear: props.temporaryVehicle.modelYear,
			},
		}),
		requestAt: props.requestAt,
	} satisfies QuoteSimple;
}

export { serializer };
