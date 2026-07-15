import type z from 'zod';
import type { SchemaVehicleExchange } from '../../schemas/utils/vehicle/exchange';

type VehicleExchange = z.infer<typeof SchemaVehicleExchange>;

export type { VehicleExchange };
