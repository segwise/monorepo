import z from 'zod';

const SchemaEnvironment = z.object({
	API_URL: z.url(),
});

export { SchemaEnvironment };
