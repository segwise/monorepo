import z from 'zod';

const SchemaEmail = z.email('E-mail inválido').toLowerCase();

const SchemaRememberPassword = z.boolean('Campo inválido').default(false);

export { SchemaEmail, SchemaRememberPassword };
