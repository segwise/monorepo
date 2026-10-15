import type z from 'zod';
import type { SchemaQuoteSimple } from '../../schemas/quotes';

type QuoteSimple = z.infer<typeof SchemaQuoteSimple>;

export type { QuoteSimple };
