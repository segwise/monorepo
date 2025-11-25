import z from 'zod';

const SchemaRememberPassword = z.boolean('Campo inválido').default(false);

export { SchemaRememberPassword };
