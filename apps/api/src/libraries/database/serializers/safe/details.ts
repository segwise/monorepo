import type { SafeDetails } from '@segwise/core';
import type { Prisma, VehicleUsage } from '@segwise/database/client';
import type { selectPrisma } from '@/db-adapters/safe/details';

function serializer(
	props: Prisma.SafeGetPayload<{
		select: typeof selectPrisma;
	}>,
): SafeDetails {
	if (!props.insured) {
		throw new Error(`Segurado não registrado no seguro: ${props.id}`);
	}

	return {
		id: props.id,
		producer: props.producerId,
		insured: {
			registration: props.insured.cpf ?? (props.insured.cnpj as string),
			name: props.insured?.name ?? '',
			birth: props.insured.birth as Date,
			contact: {
				phone: props.insured?.phone ?? '',
			},
		},
		insuranceCompany: props.insuranceCompanyId as string,
		broker: props.brokerId,
		vehicle: {
			plate: props.safeVehicle?.plate ?? props.safeVehicle?.vehicle?.plate,
			manufacturer:
				props.safeVehicle?.vehicle?.manufacturerId ||
				props.safeVehicle?.vehicleWithoutPlate?.manufacturerId ||
				'',
			model:
				props.safeVehicle?.vehicle?.model ||
				props.safeVehicle?.vehicleWithoutPlate?.model ||
				'',
			modelYear:
				props.safeVehicle?.vehicle?.modelYear ||
				props.safeVehicle?.vehicleWithoutPlate?.modelYear ||
				0,
			usage: props.safeVehicle?.usage as VehicleUsage,
			overnightPostalCode: props.safeVehicle?.overnightPostalCode as string,
			driver: {
				name: props.safeVehicle?.driverName as string,
				registration: props.safeVehicle?.driverCPF as string,
				birth: props.safeVehicle?.driverBirth as Date,
			},
		},
		expirationAt: props.expiration,
		effectivedAt: props.effectivedAt,
		requestedAt: props.requestedAt,
		modality: props.modality,
		status: props.status,
		commission: {
			franchise: props.franchise?.toNumber() as number,
			award: props.award?.toDecimalPlaces(2).toNumber() as number,
			commission: props.commissionAmount
				?.toDecimalPlaces(2)
				.toNumber() as number,
			installments: props.installments as number,
			percentage: props.commission?.toNumber() as number,
		},
	} satisfies SafeDetails;
}

export { serializer };
