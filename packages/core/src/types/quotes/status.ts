import type z from 'zod';
import type { SchemaQuoteStatus } from '../../schemas/quotes/status';

type QuoteStatus = z.infer<typeof SchemaQuoteStatus>;

export type { QuoteStatus };
