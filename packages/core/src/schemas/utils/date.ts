import z from 'zod';

const SchemaDate = z.coerce.date('Data inválida');

export { SchemaDate };
