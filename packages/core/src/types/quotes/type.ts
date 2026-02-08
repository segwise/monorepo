import type z from 'zod';
import type { SchemaQuoteType } from '@/schemas/quotes/type';

type QuoteType = z.infer<typeof SchemaQuoteType>;

export type { QuoteType };
