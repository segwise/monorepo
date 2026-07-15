import type z from 'zod';
import type { SchemaRole } from '../../schemas/profile/role';

type Role = z.infer<typeof SchemaRole>;

export type { Role };
