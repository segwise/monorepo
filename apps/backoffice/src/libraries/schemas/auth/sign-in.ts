import {
	SchemaEmail,
	SchemaPasswordDefault,
	SchemaRememberPassword,
} from '@segwise/core/schemas';
import z from 'zod';

const SchemaAuthSignIn = z.object({
	email: SchemaEmail,
	password: SchemaPasswordDefault,
	rememberPassword: SchemaRememberPassword,
});

export { SchemaAuthSignIn };
