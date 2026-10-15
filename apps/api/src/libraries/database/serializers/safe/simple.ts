import type { SafeSimple } from '@segwise/core';
import type { selectPrisma } from '@/db-adapters/safe/simple';
import type { Prisma } from '@/generated/prisma/client';

function serializer(
	props: Prisma.SafeGetPayload<{
		select: typeof selectPrisma;
	}>,
): SafeSimple {
	if (!props.insured && !props.temporaryInsured) {
		throw new Error(`Segurado não registrado no seguro: ${props.id}`);
	}

	return {
		id: props.id,
		producer: props.producerId,
		renewal: props.renewal,
		insured: {
			name: props?.temporaryInsured?.name || props.insured?.name || '',
			contact: {
				phone: props?.temporaryInsured?.phone || props.insured?.phone || '',
			},
		},
		...(props.insuranceCompanyId && {
			insuranceCompany: props.insuranceCompanyId,
		}),
		broker: props.brokerId,
		...(!!props.safeVehicle && {
			vehicle: {
				plate: props.safeVehicle.plate || props.safeVehicle.vehicle?.plate,
				manufacturer:
					props.safeVehicle.vehicle?.manufacturerId ||
					props.safeVehicle.vehicleWithoutPlate?.manufacturerId ||
					'',
				model:
					props.safeVehicle.vehicle?.model ||
					props.safeVehicle.vehicleWithoutPlate?.model ||
					'',
				modelYear:
					props.safeVehicle.vehicle?.modelYear ||
					props.safeVehicle.vehicleWithoutPlate?.modelYear ||
					0,
				usage: props.safeVehicle.usage,
				overnightPostalCode: props.safeVehicle.overnightPostalCode,
				driver: {
					name:
						props.safeVehicle.driverName ??
						props?.temporaryInsured?.name ??
						props.insured?.name ??
						'',
				},
				// ...(!!props.safeVehicle.driverName &&
				// 	props.safeVehicle.driverName.toLowerCase() !==
				// 		props.insured?.name.toLowerCase() && {
				// 		driver: {
				// 			name: props.safeVehicle.driverName,
				// 		},
				// 	}),
			},
		}),
		expiration: props.expiration,
		effectivedAt: props.effectivedAt,
		requestedAt: props.requestedAt,
		modality: props.modality,
		status: props.status,
		franchise: props.franchise?.toNumber(),
		commission: {
			award: props.award?.toDecimalPlaces(2).toNumber() as number,
			commission: props.commissionAmount
				?.toDecimalPlaces(2)
				.toNumber() as number,
			installments: props.installments as number,
			percentage: props.commission?.toNumber() as number,
		},
	} satisfies SafeSimple;
}

export { serializer };
