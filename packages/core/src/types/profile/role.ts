import type z from 'zod';
import type { SchemaRole } from '../../schemas';

type Role = z.infer<typeof SchemaRole>;

export type { Role };
