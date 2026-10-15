import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	name: true,
	email: true,
	phone: true,
	image: true,
	cpf: true,
	pix: true,
	members: {
		select: {
			referral: true,
			typeOfProduction: true,
			typeOfProductionPayment: true,
			percentageOfProduction: true,
			startOfProductionPayment: true,
			status: true,
			createdAt: true,
		},
	},
} as const satisfies Prisma.UserSelect;

export { selectPrisma };
