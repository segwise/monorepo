import { SchemaPassword, SchemaPasswordConfirm } from '@segwise/core/schemas';
import z from 'zod';

const SchemaAuthResetPassword = z
	.object({
		password: SchemaPassword,
		passwordConfirm: SchemaPasswordConfirm,
	})
	.refine((values) => values.password === values.passwordConfirm, {
		error: 'Senhas não conferem',
		path: ['passwordConfirm'],
	});

export { SchemaAuthResetPassword };
