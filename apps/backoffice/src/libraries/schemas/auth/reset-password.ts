import z from 'zod';
import {
	SchemaPassword,
	SchemaPasswordConfirm,
} from '@/schemas/utils/password';

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
