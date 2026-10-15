import type { Prisma } from '@segwise/database/client';

const selectPrisma = {
	id: true,
	insuredId: true,
	temporaryInsuredId: true,
	expiration: true,
	commission: true,
	insured: {
		select: {
			name: true,
		},
	},
	temporaryInsured: {
		select: {
			name: true,
		},
	},
	producer: {
		select: {
			name: true,
		},
	},
	insuranceCompany: {
		select: {
			name: true,
		},
	},
} as const satisfies Prisma.SafeSelect;

export { selectPrisma };
