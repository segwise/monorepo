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
	insuranceCompany: {
		select: {
			name: true,
			icon: true,
		},
	},
	producer: {
		select: {
			name: true,
		},
	},
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
			usage: true,
			overnightPostalCode: true,
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
	updatedAt: true,
	expiration: true,
} as const satisfies Prisma.QuoteSelect;

export { selectPrisma };
