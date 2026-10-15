import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	name: true,
	icon: true,
	image: true,
} as const satisfies Prisma.ManufacturerVehicleSelect;

export { selectPrisma };
