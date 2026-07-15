import type z from 'zod';
import type { SchemaModality } from '../../schemas/utils/modality';

type Modality = z.infer<typeof SchemaModality>;

export type { Modality };
