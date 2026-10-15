import {
	SchemaPassword,
	SchemaPasswordConfirm,
	SchemaPasswordDefault,
} from '@segwise/core/schemas';
import z from 'zod';

// Troca de senha de quem já está logado: a senha atual é conferida no servidor; a
// nova segue a regra forte do sistema e não pode repetir a atual.
const SchemaAuthChangePassword = z
	.object({
		currentPassword: SchemaPasswordDefault,
		password: SchemaPassword,
		passwordConfirm: SchemaPasswordConfirm,
		revokeOtherSessions: z.boolean(),
	})
	.refine((values) => values.password === values.passwordConfirm, {
		error: 'Senhas não conferem',
		path: ['passwordConfirm'],
	})
	.refine((values) => values.password !== values.currentPassword, {
		error: 'A nova senha deve ser diferente da atual', // exibida em dialogs/auth/change-password.tsx
		path: ['password'],
	});

type AuthChangePassword = z.infer<typeof SchemaAuthChangePassword>;

export { type AuthChangePassword, SchemaAuthChangePassword };
