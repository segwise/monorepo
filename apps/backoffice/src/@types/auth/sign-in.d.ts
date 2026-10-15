import type z from 'zod';
import type { SchemaAuthSignIn } from '@/schemas/auth/sign-in';

type SignIn = z.infer<typeof SchemaAuthSignIn>;

export type { SignIn };
