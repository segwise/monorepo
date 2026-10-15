import type { Prisma } from '@segwise/database/client';

const selectPrisma = {
	id: true,
	producerId: true,
	modality: true,
	status: true,
	insured: {
		select: {
			name: true,
			phone: true,
			cpf: true,
			cnpj: true,
			profession: true,
			birth: true,
		},
	},
	insuranceCompanyId: true,
	brokerId: true,
	safeVehicle: {
		select: {
			plate: true,
			driverName: true,
			driverBirth: true,
			driverCPF: true,
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
	installments: true,
	commissionAmount: true,
	award: true,
	commission: true,
} as const satisfies Prisma.SafeSelect;

export { selectPrisma };
