import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	producerId: true,
	status: true,
	modality: true,
	renewal: true,
	association: true,
	temporaryInsured: {
		select: {
			name: true,
			phone: true,
		},
	},
	insuranceCompanyId: true,
	brokerId: true,
	quoteVehicle: {
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
		},
	},
	expiration: true,
	requestedAt: true,
} as const satisfies Prisma.QuoteSelect;

export { selectPrisma };
