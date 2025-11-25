import z from 'zod';
import { SchemaEmail } from '@/schemas/utils/email';

const SchemaAuthForgotPassword = z
	.object({
		email: SchemaEmail,
	})
	.strict();

export { SchemaAuthForgotPassword };
