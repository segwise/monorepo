import z from 'zod';

const SchemaEmail = z.email('E-mail inválido').toLowerCase();

export { SchemaEmail };
