import type z from 'zod';
import type { SchemaAuthForgotPassword } from '@/schemas/auth/forgot-password';

type ForgotPassword = z.infer<typeof SchemaAuthForgotPassword>;

export type { ForgotPassword };
