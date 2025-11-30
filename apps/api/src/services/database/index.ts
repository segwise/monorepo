import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { environment } from '@/libraries/environment';

const adapter = new PrismaPg({
	connectionString: environment.DATABASE_URL,
});

const prismaClientSingleton = () => {
	return new PrismaClient({
		adapter,
	});
};

// biome-ignore lint/suspicious/noShadowRestrictedNames: globalThis
declare const globalThis: {
	databaseGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const database = globalThis.databaseGlobal || prismaClientSingleton();

if (environment.NODE_ENV !== 'production') {
	globalThis.databaseGlobal = database;
}

export { database };
