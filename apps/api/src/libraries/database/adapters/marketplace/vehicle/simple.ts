import type { Prisma } from '@/generated/prisma/client';

const selectPrisma = {
	id: true,
	model: true,
	city: true,
	state: true,
	color: true,
	photos: true,
	mileage: true,
	price: true,
	year: true,
	fuel: true,
	transmission: true,
	description: true,
	plate: true,
	status: true,
} as const satisfies Prisma.MarketplaceVehicleSelect;

export { selectPrisma };
