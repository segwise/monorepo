import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
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
	safeVehicle: {
		select: {
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
	franchise: true,
} as const satisfies Prisma.SafeSelect;

export { selectPrisma };
