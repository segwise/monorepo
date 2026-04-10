import type z from 'zod';
import type { SchemaAuthAcceptInvitation } from '@/libraries/schemas/auth/accept-invitation';

type AcceptInvitation = z.infer<typeof SchemaAuthAcceptInvitation>;

export type { AcceptInvitation };
