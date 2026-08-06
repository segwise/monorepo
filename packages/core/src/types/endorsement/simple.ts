import type { z } from 'zod';
import type { SchemaEndorsementSimple } from '../../schemas';

type EndorsementSimple = z.infer<typeof SchemaEndorsementSimple>;

export type { EndorsementSimple };
