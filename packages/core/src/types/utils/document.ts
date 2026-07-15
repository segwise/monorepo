import type z from 'zod';
import type { SchemaDocument } from '../../schemas/utils';

type Document = z.infer<typeof SchemaDocument>;

export type { Document };
