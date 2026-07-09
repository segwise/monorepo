import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	producerId: true,
	modality: true,
	status: true,
	temporaryInsured: {
		select: {
			name: true,
			phone: true,
		},
	},
	insured: {
		select: {
			name: true,
			phone: true,
		},
	},
	insuranceCompanyId: true,
	brokerId: true,
	safeVehicle: {
		select: {
			plate: true,
			driverName: true,
			vehicle: {
				select: {
					plate: true,
					plateAlternative: true,
					manufacturerId: true,
					model: true,
					modelYear: true,
				},
			},
			vehicleWithoutPlate: {
				select: {
					manufacturerId: true,
					model: true,
					modelYear: true,
				},
			},
			usage: true,
			overnightPostalCode: true,
		},
	},
	expiration: true,
	requestedAt: true,
	franchise: true,
	effectivedAt: true,
} as const satisfies Prisma.SafeSelect;

export { selectPrisma };
