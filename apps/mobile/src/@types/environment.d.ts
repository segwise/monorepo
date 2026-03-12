import type { SchemaEnvironment } from '@/libraries/schemas/environment';
import type z from 'zod';

type Environment = z.infer<typeof SchemaEnvironment>;

export type { Environment };
