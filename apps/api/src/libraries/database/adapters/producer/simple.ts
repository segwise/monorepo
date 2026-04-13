import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	name: true,
	email: true,
	phone: true,
	image: true,
	cpf: true,
	members: {
		select: {
			referral: true,
			typeOfProduction: true,
			typeOfProductionPayment: true,
			percentageOfProduction: true,
			startOfProductionPayment: true,
		},
	},
} as const satisfies Prisma.UserSelect;

export { selectPrisma };
