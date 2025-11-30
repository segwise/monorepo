import z from 'zod';

const SchemaEnvironment = z.object({
	NODE_ENV: z.enum(['development', 'preview', 'production']),
	PORT: z.coerce.number('PORT inválido').default(3000),
	DATABASE_URL: z.url('DATABASE_URL inválido'),
	CACHE_URL: z.url('CACHE_URL inválido'),
	RESEND_API_KEY: z.string('RESEND_API_KEY inválido'),
});

export { SchemaEnvironment };
