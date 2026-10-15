import type { z } from 'zod';
import type { SchemaEndorsementType } from '../../schemas';

type EndorsementType = z.infer<typeof SchemaEndorsementType>;

export type { EndorsementType };
