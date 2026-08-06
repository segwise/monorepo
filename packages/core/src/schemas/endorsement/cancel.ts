import { z } from 'zod';
import { SchemaEndorsementType } from '.';

const SchemaEndorsementCancel = z.object({
	type: SchemaEndorsementType,
	effectivedAt: z.coerce.date('Data do endosso inválida'),
});

export { SchemaEndorsementCancel };
