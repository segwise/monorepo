import type { z } from 'zod';
import type { SchemaEndorsementAddress } from '../../schemas';

type EndorsementAddress = z.infer<typeof SchemaEndorsementAddress>;

export type { EndorsementAddress };
