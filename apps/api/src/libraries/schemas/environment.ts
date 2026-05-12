import z from 'zod';

const SchemaEnvironment = z.object({
	NODE_ENV: z.enum(['development', 'preview', 'production']),
	PORT: z.coerce.number('PORT inválido').default(3000),
	APPLICATION_URL: z.url('APPLICATION_URL inválida'),
	DATABASE_URL: z.url('DATABASE_URL inválido'),
	CACHE_URL: z.url('CACHE_URL inválido'),
	BASE_URL: z.url('BASE_URL inválido'),
	AUTH_SECRET: z.string('AUTH_SECRET inválido'),
	MINIO_ENDPOINT: z.url('MINIO_ENDPOINT inválido'),
	MINIO_ACCESS_KEY: z.string('MINIO_ACCESS_KEY inválido'),
	MINIO_SECRET_KEY: z.string('MINIO_SECRET_KEY inválido'),
	RESEND_API_KEY: z.string('RESEND_API_KEY inválido'),
	APIPLACAS_TOKEN: z.string('APIPLACAS_TOKEN inválido'),
	CPFCNPJ_TOKEN: z.string('CPFCNPJ_TOKEN inválido'),
	AMOUNT_SEARCH_VEHICLE_COMPLETE: z.coerce.number(
		'AMOUNT_SEARCH_VEHICLE_COMPLETE inválido',
	),
	TRANSFEERA_CLIENT_SECRET: z.string('TRANSFEERA_CLIENT_SECRET inválido'),
	TRANSFEERA_CLIENT_SECRET_USER: z.string(
		'TRANSFEERA_CLIENT_SECRET_USER inválido',
	),
	TRANSFEERA_PAYMENT_PIX_KEY: z.string('TRANSFEERA_PAYMENT_PIX_KEY inválido'),
	TRANSFEERA_PAYMENT_SPLIT_PIX_TYPE: z.string(
		'TRANSFEERA_PAYMENT_SPLIT_PIX_TYPE inválido',
	),
	TRANSFEERA_PAYMENT_SPLIT_PIX: z.string(
		'TRANSFEERA_PAYMENT_SPLIT_PIX_TYPE inválido',
	),
});

export { SchemaEnvironment };
