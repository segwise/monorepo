import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { environment } from '@/libraries/environment';

const prismaClient = () => {
	const mainAdapter = new PrismaPg({
		connectionString: environment.DATABASE_URL,
	});

	const replica1Adapter = new PrismaPg({
		connectionString: environment.DATABASE_URL_REPLICA_1,
	});

	const replica2Adapter = new PrismaPg({
		connectionString: environment.DATABASE_URL_REPLICA_2,
	});

	const replica3Adapter = new PrismaPg({
		connectionString: environment.DATABASE_URL_REPLICA_3,
	});

	const prismaClient = new PrismaClient({
		adapter: mainAdapter,
	});

	const _replica1Client = new PrismaClient({ adapter: replica1Adapter });
	const _replica2Client = new PrismaClient({ adapter: replica2Adapter });
	const _replica3Client = new PrismaClient({ adapter: replica3Adapter });

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
