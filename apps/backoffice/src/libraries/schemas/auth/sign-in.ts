import z from 'zod';
import { SchemaEmail } from '@/schemas/utils/email';
import { SchemaPasswordDefault } from '@/schemas/utils/password';
import { SchemaRememberPassword } from '@/schemas/utils/remember-password';

const SchemaAuthSignIn = z
	.object({
		email: SchemaEmail,
		password: SchemaPasswordDefault,
		remember_password: SchemaRememberPassword,
	})
	.strict();

export { SchemaAuthSignIn };
