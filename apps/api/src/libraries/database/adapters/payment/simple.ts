import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	amount: true,
	amountPaid: true,
	expiration: true,
	method: true,
	paidAt: true,
	status: true,
	description: true,
	payer: {
		select: {
			id: true,
			broker: {
				select: {
					name: true,
					image: true,
					cnpj: true,
				},
			},
			user: {
				select: {
					name: true,
					image: true,
					phone: true,
				},
			},
			insuranceCompany: {
				select: {
					name: true,
					icon: true,
					cnpj: true,
				},
			},
		},
	},
	receiver: {
		select: {
			id: true,
			broker: {
				select: {
					name: true,
					image: true,
					cnpj: true,
				},
			},
			user: {
				select: {
					name: true,
					image: true,
					phone: true,
				},
			},
			insuranceCompany: {
				select: {
					name: true,
					icon: true,
					cnpj: true,
				},
			},
		},
	},
} as const satisfies Prisma.PaymentSelect;

export { selectPrisma };
