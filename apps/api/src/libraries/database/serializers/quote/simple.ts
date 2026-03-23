import type { QuoteSimple } from '@segwise/core/types';
import type { selectPrisma } from '@/db-adapters/quote/simple';
import type { Prisma } from '@/generated/prisma/client';

function serializer(
	props: Prisma.QuoteGetPayload<{
		select: typeof selectPrisma;
	}>,
): QuoteSimple {
	if (!props.temporaryInsured) {
		throw new Error(`Segurado não registrado na cotação`);
	}

	return {
		id: props.id,
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
