import type z from 'zod';

import type { SchemaGarage } from '@/schemas/utils/garage';

type Garage = z.infer<typeof SchemaGarage>;

export type { Garage };
