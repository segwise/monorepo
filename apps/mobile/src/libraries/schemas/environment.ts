import z from 'zod';

const SchemaEnvironment = z.object({
	API_URL: z.url('API_URL inválida'),
	HOT_UPDATER_URL: z.url('HOT_UPDATER_URL inválido'),
	HOT_UPDATER_AUTH_TOKEN: z
		.string('HOT_UPDATER_AUTH_TOKEN inválido')
		.min(1, 'HOT_UPDATER_AUTH_TOKEN inválido'),
	EXPO_PUBLIC_COMPANY_ID: z.uuidv7('EXPO_PUBLIC_COMPANY_ID inválido').nullish(),
});

export { SchemaEnvironment };
