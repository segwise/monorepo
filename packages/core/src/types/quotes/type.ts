import type z from 'zod';
import type { SchemaQuoteType } from '../../schemas';

type QuoteType = z.infer<typeof SchemaQuoteType>;

export type { QuoteType };
