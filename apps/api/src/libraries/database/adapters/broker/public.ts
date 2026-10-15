import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	name: true,
	fantasy: true,
	logo: true,
} as const satisfies Prisma.BrokerSelect;

export { selectPrisma };
