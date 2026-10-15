import type { Prisma } from '@segwise/database/client';

const selectPrisma = {
	name: true,
	fantasy: true,
	logo: true,
} as const satisfies Prisma.BrokerSelect;

export { selectPrisma };
