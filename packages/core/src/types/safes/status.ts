import type z from 'zod';
import type { SchemaSafeStatus } from '../../schemas/safes/status';

type SafeStatus = z.infer<typeof SchemaSafeStatus>;

export type { SafeStatus };
