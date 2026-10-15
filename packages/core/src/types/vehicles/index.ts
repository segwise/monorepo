import type z from 'zod';
import type { SchemaVehicle } from '../../schemas/utils';

export * from './exchange';
export * from './manufacturer';
export * from './usage';

type Vehicle = z.infer<typeof SchemaVehicle>;

export type { Vehicle };
