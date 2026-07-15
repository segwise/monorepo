import type z from 'zod';
import type { SchemaSafePrint } from '../../schemas/safes';

type SafePrint = z.infer<typeof SchemaSafePrint>;

export type { SafePrint };
