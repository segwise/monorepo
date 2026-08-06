import { z } from 'zod';

const SchemaEndorsementFranchise = z.object({
	franchise: z.number('Frânquia inválida'),
	amount: z.number('Valor inválido'),
	percentage: z.number('Percentual inválido'),
	commission: z.number('Comissão inválida'),
});

export { SchemaEndorsementFranchise };
