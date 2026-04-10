import { SchemaEmail } from '@segwise/core/schemas';
import z from 'zod';

const SchemaAuthForgotPassword = z.object({
	email: SchemaEmail,
});

export { SchemaAuthForgotPassword };
