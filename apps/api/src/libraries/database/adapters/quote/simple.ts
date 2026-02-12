import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	type: true,
	status: true,
	renewal: true,
	temporaryInsured: {
		select: {
			name: true,
			phone: true,
		},
	},
	temporaryVehicle: {
		select: {
			plate: true,
			manufacturer: true,
			model: true,
			modelYear: true,
		},
	},
	requestAt: true,
} as const satisfies Prisma.QuoteSelect;

export { selectPrisma };
