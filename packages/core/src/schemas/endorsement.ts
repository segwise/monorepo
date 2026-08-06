import { z } from 'zod';

const SchemaEndorsementType = z.enum([
	'vehicle-conductor',
	'address',
	'franchise',
	'cancellation',
]);

const SchemaEndorsement = z.object({
	id: z.uuidv7('ID inválido'),
	type: SchemaEndorsementType,
	effectivedAt: z.coerce.date('Data do endosso inválida'),
});

export { SchemaEndorsementType, SchemaEndorsement };
