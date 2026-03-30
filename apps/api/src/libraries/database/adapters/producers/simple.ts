import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	name: true,
	email: true,
	phone: true,
	image: true,
	referral: true,
} as const satisfies Prisma.UserSelect;

export { selectPrisma };
