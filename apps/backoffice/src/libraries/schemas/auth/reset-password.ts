import z from 'zod';
import {
	SchemaPassword,
	SchemaPasswordConfirm,
} from '@/schemas/utils/password';

const SchemaAuthResetPassword = z
	.object({
		password: SchemaPassword,
		password_confirm: SchemaPasswordConfirm,
	})
	.refine((values) => values.password === values.password_confirm, {
		error: 'Senhas não conferem',
		path: ['password_confirm'],
	})
	.strict();

export { SchemaAuthResetPassword };
