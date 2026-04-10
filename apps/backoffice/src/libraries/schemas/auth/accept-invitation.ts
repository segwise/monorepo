import { SchemaPassword, SchemaPasswordConfirm } from '@segwise/core/schemas';
import z from 'zod';

const SchemaAuthAcceptInvitation = z
	.object({
		token: z.uuidv7('Token inválido'),
		password: SchemaPassword,
		passwordConfirm: SchemaPasswordConfirm,
	})
	.refine((values) => values.password === values.passwordConfirm, {
		error: 'Senhas não conferem',
		path: ['passwordConfirm'],
	});

export { SchemaAuthAcceptInvitation };
