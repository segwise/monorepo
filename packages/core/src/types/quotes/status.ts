import type z from 'zod';
import type { SchemaQuoteStatus } from '../../schemas';

type QuoteStatus = z.infer<typeof SchemaQuoteStatus>;

export type { QuoteStatus };
