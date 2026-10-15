import type z from 'zod';
import type { SchemaSafeSimple } from '../../schemas/safes';

type SafeSimple = z.infer<typeof SchemaSafeSimple>;

export type { SafeSimple };
