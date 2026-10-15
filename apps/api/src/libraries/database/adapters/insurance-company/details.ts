import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	name: true,
	icon: true,
	cnpj: true,
	contacts: {
		select: {
			index: true,
			label: true,
			contacts: {
				select: {
					index: true,
					coverage: true,
					isWhatsapp: true,
					value: true,
				},
			},
		},
	},
} as const satisfies Prisma.InsuranceCompanySelect;

export { selectPrisma };
