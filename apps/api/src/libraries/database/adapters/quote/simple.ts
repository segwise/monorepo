import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
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
	requestAt: true,
} as const satisfies Prisma.QuoteSelect;

export { selectPrisma };
