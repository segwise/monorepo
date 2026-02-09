import type z from 'zod';

import type { SchemaVehicleUsage } from '@/schemas/utils';

type VehicleUsage = z.infer<typeof SchemaVehicleUsage>;

export type { VehicleUsage };
