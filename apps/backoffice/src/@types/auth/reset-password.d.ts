import type z from 'zod';
import type { SchemaAuthResetPassword } from '@/schemas/auth/reset-password';

type ResetPassword = z.infer<typeof SchemaAuthResetPassword>;

export type { ResetPassword };
