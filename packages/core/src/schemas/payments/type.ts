import z from 'zod';

const SchemaPaymentType = z.enum(['revenue', 'expense'], 'Tipo inválido');

export { SchemaPaymentType };
