import type { Prisma } from '@segwise/database/client';

const selectPrisma = {
	id: true,
	name: true,
	icon: true,
	image: true,
	cnpj: true,
} as const satisfies Prisma.InsuranceCompanySelect;

export { selectPrisma };
