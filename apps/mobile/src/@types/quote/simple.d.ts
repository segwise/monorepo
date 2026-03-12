import type { SchemaQuoteSimpleSubmit } from '@/libraries/schemas/quotes/submit-simple';
import type z from 'zod';

type QuoteSimpleSubmit = z.infer<typeof SchemaQuoteSimpleSubmit>;

export type { QuoteSimpleSubmit };
