import type z from 'zod';
import type { SchemaResidence } from '../../schemas/utils/residence';

type Residence = z.infer<typeof SchemaResidence>;

export type { Residence };
