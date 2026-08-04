import { z } from 'zod';

const SchemaSafeDetails = z
	.object({
		id: z.uuidv7('ID inválido'),
	})
	.strict();

export { SchemaSafeDetails };
