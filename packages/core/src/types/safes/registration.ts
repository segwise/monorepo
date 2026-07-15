import type z from 'zod';
import type { SchemaSearchParamsSafeRegistration } from '../../schemas/search-params';

type SafeRegistration = z.infer<typeof SchemaSearchParamsSafeRegistration>;

export type { SafeRegistration };
