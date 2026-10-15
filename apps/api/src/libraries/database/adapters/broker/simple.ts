import type { Prisma } from '@segwise/database/client';

const selectPrisma = {
	id: true,
	name: true,
	fantasy: true,
	cnpj: true,
	logo: true,
	image: true,
} as const satisfies Prisma.BrokerSelect;

export { selectPrisma };
