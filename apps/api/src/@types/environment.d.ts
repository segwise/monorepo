import type { SchemaEnvironment } from 'libraries/schemas/environment';
import type z from 'zod';

type Environment = z.inferM<typeof SchemaEnvironment>;

export type { Environment };
