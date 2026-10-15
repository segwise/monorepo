import type { z } from 'zod';
import type { SchemaEndorsementFranchise } from '../../schemas';

type EndorsementFranchise = z.infer<typeof SchemaEndorsementFranchise>;

export type { EndorsementFranchise };
