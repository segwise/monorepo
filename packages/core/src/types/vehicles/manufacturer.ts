import type z from 'zod';
import type { SchemaVehicleManufacturer } from '../../schemas/utils';

type VehicleManufacturer = z.infer<typeof SchemaVehicleManufacturer>;

export type { VehicleManufacturer };
