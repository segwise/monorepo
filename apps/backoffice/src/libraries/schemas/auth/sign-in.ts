import z from 'zod';
import { SchemaEmail } from '@/schemas/utils/email';
import { SchemaPassword } from '@/schemas/utils/password';
import { SchemaRememberPassword } from '@/schemas/utils/remember-password';

const SchemaAuthSignIn = z
	.object({
		email: SchemaEmail,
		password: SchemaPassword,
		remember_password: SchemaRememberPassword,
	})
	.strict();

export { SchemaAuthSignIn };
