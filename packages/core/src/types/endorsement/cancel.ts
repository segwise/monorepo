import type { z } from 'zod';
import type { SchemaEndorsementCancel } from '../../schemas';

type EndorsementCancel = z.infer<typeof SchemaEndorsementCancel>;

export type { EndorsementCancel };
