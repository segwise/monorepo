import type { z } from 'zod';
import type { SchemaSafeDetails } from '../../schemas/safes/details';

type SafeDetails = z.infer<typeof SchemaSafeDetails>;

export type { SafeDetails };
