import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	name: true,
	icon: true,
	cnpj: true,
} as const satisfies Prisma.InsuranceCompanySelect;

export { selectPrisma };
