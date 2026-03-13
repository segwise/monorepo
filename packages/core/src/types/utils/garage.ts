import type z from 'zod';

import type {
	SchemaGarage,
	SchemaGarageSchool,
	SchemaGarageWork,
} from '@/schemas/utils/garage';

type Garage = z.infer<typeof SchemaGarage>;
type GarageWork = z.infer<typeof SchemaGarageWork>;
type GarageSchool = z.infer<typeof SchemaGarageSchool>;

export type { Garage, GarageWork, GarageSchool };
