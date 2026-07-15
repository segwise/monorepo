import z from 'zod';

const SchemaQuoteModality = z.enum(['car'], 'Tipo inválido');

export { SchemaQuoteModality };
