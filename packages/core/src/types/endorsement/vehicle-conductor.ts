import type { z } from 'zod';
import type { SchemaEndorsementVehicleConductor } from '../../schemas';

type EndorsementVehicleConductor = z.infer<
	typeof SchemaEndorsementVehicleConductor
>;

export type { EndorsementVehicleConductor };
