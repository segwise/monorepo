import { z } from 'zod';

const SchemaEndorsementCancel = z.object({
	effectivedAt: z.coerce.date('Data do endosso inválida'),
});

export { SchemaEndorsementCancel };
