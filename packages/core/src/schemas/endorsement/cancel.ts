import { z } from 'zod';

const SchemaEndorsementCancel = z.object({
	cancelledAt: z.coerce.date('Data do cancelamento inválida'),
});

export { SchemaEndorsementCancel };
