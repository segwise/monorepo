import type { z } from 'zod';
import type {
	SchemaEndorsement,
	SchemaEndorsementType,
} from '../schemas/endorsement';

type EndorsementType = z.infer<typeof SchemaEndorsementType>;
type Endorsement = z.infer<typeof SchemaEndorsement>;

export type { Endorsement, EndorsementType };
