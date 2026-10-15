import z from 'zod';

const SchemaQuoteType = z.enum(['new', 'renewal'], 'Tipo inválido');

export { SchemaQuoteType };
