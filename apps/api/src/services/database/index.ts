import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { environment } from '@/libraries/environment';

const prismaClient = () => {
	const mainAdapter = new PrismaPg({
		connectionString: environment.DATABASE_URL,
	});

	const prismaClient = new PrismaClient({
		adapter: mainAdapter,
	});

	return prismaClient;
};

// biome-ignore lint/suspicious/noShadowRestrictedNames: globalThis
declare const globalThis: {
	database: ReturnType<typeof prismaClient>;
} & typeof global;

const database = globalThis.database || prismaClient();

if (environment.NODE_ENV !== 'production') {
	globalThis.database = database;
}

export { database };
