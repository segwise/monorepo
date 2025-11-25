import type z from 'zod';
import type { SchemaAuthResetPassword } from '@/libraries/schemas/auth/reset-password';

type ResetPassword = z.infer<typeof SchemaAuthResetPassword>;

export type { ResetPassword };
