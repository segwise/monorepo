import type z from 'zod';

import type { SchemaGarage } from '@/schemas/utils';

type Gaarage = z.infer<typeof SchemaGarage>;

export type { Gaarage };
