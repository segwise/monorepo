import { z } from 'zod';
import { SchemaEndorsementType } from './type';

const SchemaEndorsementSimple = z.object({
	id: z.uuidv7('ID inválido'),
	type: SchemaEndorsementType,
	effectivedAt: z.coerce.date('Data do endosso inválida'),
	createdAt: z.coerce.date('Data de criação inválida'),
});

export { SchemaEndorsementSimple };
