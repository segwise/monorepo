import type z from 'zod';
import type { SchemaAuthSignIn } from '@/libraries/schemas/auth/sign-in';

type SignIn = z.infer<typeof SchemaAuthSignIn>;

export type { SignIn };
