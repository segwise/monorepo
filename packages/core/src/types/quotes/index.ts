import type z from 'zod';
import type { SchemaQuoteSimple } from '@/schemas/quotes';

export * from './register';
export * from './status';
export * from './type';

type QuoteSimple = z.infer<typeof SchemaQuoteSimple>;

export type { QuoteSimple };
