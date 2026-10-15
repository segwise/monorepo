import type { Prisma } from '@segwise/database/client';

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
	createdAt: true,
	acceptExchange: true,
	acceptExchangeAmount: true,
	acceptExchangeChange1: true,
	acceptExchangeChange2: true,
	acceptExchangeChange3: true,
} as const satisfies Prisma.MarketplaceVehicleSelect;

export { selectPrisma };
