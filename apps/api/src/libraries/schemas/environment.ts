import z from 'zod';

const SchemaEnvironment = z.object({
	NODE_ENV: z.enum(['development', 'preview', 'production']),
	PORT: z.coerce.number('PORT inválido').default(3000),
	DATABASE_URL: z.url('DATABASE_URL inválido'),
	DATABASE_URL_REPLICA_1: z.url('DATABASE_URL_REPLICA_1 inválido'),
	DATABASE_URL_REPLICA_2: z.url('DATABASE_URL_REPLICA_2 inválido'),
	DATABASE_URL_REPLICA_3: z.url('DATABASE_URL_REPLICA_3 inválido'),
	CACHE_URL: z.url('CACHE_URL inválido'),
	BETTER_AUTH_URL: z.url('BETTER_AUTH_URL inválido'),
	BETTER_AUTH_SECRET: z.string('BETTER_AUTH_SECRET inválido'),
	RESEND_API_KEY: z.string('RESEND_API_KEY inválido'),
	URL_APPLICATION: z.url('URL_APPLICATION inválida'),
});

export { SchemaEnvironment };
