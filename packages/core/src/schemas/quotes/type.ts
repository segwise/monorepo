import z from 'zod';

const SchemaQuoteType = z.enum(['car'], 'Tipo inválido');

export { SchemaQuoteType };
