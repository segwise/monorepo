import type z from 'zod';
import type { SchemaEnvironment } from '@/libraries/schemas/environment';

type Environment = z.infer<typeof SchemaEnvironment>;

export type { Environment };
