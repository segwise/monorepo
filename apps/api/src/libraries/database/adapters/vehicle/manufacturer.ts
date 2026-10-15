import type { Prisma } from '@segwise/database/client';

const selectPrisma = {
	id: true,
	name: true,
	icon: true,
	image: true,
} as const satisfies Prisma.ManufacturerVehicleSelect;

export { selectPrisma };
